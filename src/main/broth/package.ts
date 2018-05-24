import { goos, goarch } from "./platform";
import { request } from "../net/request/metal-request";
import querystring from "querystring";
import urls from "common/constants/urls";
import * as sf from "../os/sf";
import * as semver from "semver";

import { promisify } from "util";
import whichCallback from "which";
const which = promisify(whichCallback);

import rootLogger, { Logger } from "common/logger";
import { IStore, IPackageState, IProgressInfo } from "common/types";
import { join, dirname } from "path";
import { readdir, mkdirp } from "../os/sf";
import formulas, { FormulaSpec } from "./formulas";
import { downloadToFile } from "../net";
import { actions } from "common/actions";
import { unzip } from "./unzip";

import { delay } from "../reactors/delay";

const sanityCheckTimeout = 10000;
const platform = `${goos()}-${goarch()}`;

const downloadStart = 0.0;
const downloadWeight = 0.3;

const extractStart = downloadStart + downloadWeight;
const extractWeight = 0.3;

type Version = string;

interface VersionsRes {
  versions: Version[];
}

var useLocals = (process.env.BROTH_USE_LOCAL || "").split(",");

export interface PackageLike {
  ensure(): Promise<void>;
  upgrade(): Promise<void>;
}

export class Package implements PackageLike {
  private store: IStore;
  private formula: FormulaSpec;
  private prefix: string;
  private name: string;
  private baseURL: string;
  private logger: Logger;
  private semverConstraint: string;

  constructor(store: IStore, prefix: string, name: string) {
    this.store = store;
    this.prefix = prefix;
    this.name = name;
    this.formula = formulas[name];
    if (!this.formula) {
      throw new Error(`No spec for formula: ${this.name}`);
    }
    let channel = platform;
    if (this.formula.transformChannel) {
      channel = this.formula.transformChannel(channel);
    }
    if (this.formula.getSemverConstraint) {
      this.semverConstraint = this.formula.getSemverConstraint();
    }
    this.baseURL = `${urls.brothRepo}/${name}/${channel}`;
    this.logger = rootLogger.child({ name: `broth :: ${name}` });
    this.stage("idle");
  }

  buildURL(path: string, queryParams?: { [key: string]: any }): string {
    const cleanPath = path.replace(/^\//, "");
    let query = "";
    if (queryParams) {
      query = "?" + querystring.stringify(queryParams);
    }
    return `${this.baseURL}/${cleanPath}${query}`;
  }

  buildDownloadURL(version: Version, path: string) {
    const cleanPath = path.replace(/^\//, "");
    const remoteVersionFolder = version;
    return this.buildURL(`/${remoteVersionFolder}/${cleanPath}`);
  }

  /** fetch latest version number from repo */
  async getLatestVersion(): Promise<Version> {
    if (this.semverConstraint) {
      this.debug(
        `Trying to satisfy semver constraint ${this.semverConstraint}`
      );
      const url = this.buildURL(`/versions`);
      this.debug(`GET ${url}`);
      const res = await request("get", url, {});
      if (res.statusCode !== 200) {
        throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`);
      }

      const versionsRes = res.body as VersionsRes;
      if (!versionsRes.versions) {
        throw new Error(
          `got invalid response from broth server: expected JSON object with 'broth' field, got: ${JSON.stringify(
            versionsRes
          )}`
        );
      }

      // already ordered from most recent to least recent
      for (const v of versionsRes.versions) {
        if (semver.satisfies(v, this.semverConstraint)) {
          return v;
        } else {
          this.debug(`Ignoring ${v}`);
        }
      }

      throw new Error(
        `Could not find a version satisfying ${this.semverConstraint}`
      );
    } else {
      this.debug("No semver constraint, going with /LATEST");
      const url = this.buildURL(`/LATEST`);
      this.debug(`GET ${url}`);
      const res = await request("get", url, {});
      if (res.statusCode !== 200) {
        throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`);
      }

      const versionString = res.body.toString("utf8").trim();
      return versionString as Version;
    }
  }

  getName(): string {
    return this.name;
  }

  getVersionsDir(): string {
    return join(this.prefix, this.name, "versions");
  }

  getDownloadsDir(): string {
    return join(this.prefix, this.name, "downloads");
  }

  getChosenMarkerPath(): string {
    return join(this.prefix, this.name, ".chosen-version");
  }

  getVersionPrefix(version: Version): string {
    return join(this.getVersionsDir(), version);
  }

  getInstalledMarkerPath(version: Version): string {
    return join(this.getVersionPrefix(version), ".installed");
  }

  info(msg: string) {
    this.logger.info(msg);
  }

  warn(msg: string) {
    this.logger.warn(msg);
  }

  debug(msg: string) {
    this.logger.debug(msg);
  }

  shouldUseLocal(): boolean {
    return useLocals.indexOf(this.name) !== -1;
  }

  async ensure() {
    if (this.shouldUseLocal()) {
      this.info(`Looking for local binary...`);

      const executablePath = await which(this.name);
      this.info(`Found at ${executablePath}`);

      this.store.dispatch(
        actions.packageGotVersionPrefix({
          name: this.name,
          version: "whatever is in $PATH",
          versionPrefix: dirname(executablePath),
        })
      );
      return;
    }

    await mkdirp(this.getVersionsDir());

    try {
      await this.upgrade();
    } catch (e) {
      this.warn(`Could not run upgrade: ${e.stack}`);
      this.info(`Seeing if we have everything we need offline...`);

      const chosenVersion = await this.getChosenVersion();
      if (chosenVersion && (await this.isVersionValid(chosenVersion))) {
        this.info(`${chosenVersion} is chosen and valid`);
        this.refreshPrefix(chosenVersion);
      } else {
        throw e;
      }
    }
  }

  getCurrentVersionPrefix(): string {
    return this.store.getState().broth.packages[this.name].versionPrefix;
  }

  refreshPrefix(version: Version) {
    const newVersionPrefix = this.getVersionPrefix(version);
    const oldVersionPrefix = this.getCurrentVersionPrefix();

    if (newVersionPrefix !== oldVersionPrefix) {
      this.info(`Switching to ${version}`);
      this.store.dispatch(
        actions.packageGotVersionPrefix({
          name: this.name,
          version: version,
          versionPrefix: newVersionPrefix,
        })
      );
    }
  }

  upgradeLock = false;
  async upgrade() {
    if (this.shouldUseLocal()) {
      this.info(`Using local, so, not upgrading.`);
      return;
    }

    if (this.upgradeLock) {
      throw new Error(`package ${this.name} locked`);
    }
    try {
      this.upgradeLock = true;
      this.stage("assess");
      await this.doUpgrade();
    } finally {
      this.upgradeLock = false;
      this.stage("idle");

      try {
        await sf.wipe(this.getDownloadsDir());
      } catch (e) {
        this.warn(`While cleaning downloads dir: ${e.stack}`);
      }

      try {
        await this.cleanOldVersions();
      } catch (e) {
        this.warn(`While cleaning old versions: ${e.stack}`);
      }
    }
  }

  private stage(stage: IPackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }

  private emitProgress(progressInfo: IProgressInfo) {
    this.store.dispatch(
      actions.packageProgress({ name: this.name, progressInfo })
    );
    this.store.dispatch(
      actions.setupOperationProgress({ progress: progressInfo })
    );
  }

  private async doUpgrade() {
    let latestVersion: Version;
    try {
      latestVersion = await this.getLatestVersion();
    } catch (e) {
      this.logger.warn(`While checking for latest version: ${e.stack}`);
      throw new Error(
        `Could not retrieve latest version of ${this.name}: ${e.message}`
      );
    }
    this.info(`Latest is ${latestVersion}`);

    if (
      this.getVersionPrefix(latestVersion) === this.getCurrentVersionPrefix()
    ) {
      this.info(`Already the active version, nothing to do`);
      return;
    }

    if (await this.isVersionValid(latestVersion)) {
      // do nothing
    } else {
      this.store.dispatch(
        actions.setupStatus({
          icon: "install",
          message: ["login.status.finalizing_installation"],
        })
      );

      const archiveName = `${this.name}.zip`;
      const archiveUrl = this.buildDownloadURL(
        latestVersion,
        `/${archiveName}`
      );

      await sf.wipe(this.getDownloadsDir());
      const archivePath = join(this.getDownloadsDir(), archiveName);

      this.stage("download");
      this.info(`Downloading ${this.name}@${latestVersion}`);
      this.info(`...from ${archiveUrl}`);
      this.info(`...to ${archivePath}`);

      await downloadToFile(
        info => {
          let newInfo = {
            ...info,
            progress: downloadStart + info.progress * downloadWeight,
          };
          this.emitProgress(newInfo);
        },
        this.logger,
        archiveUrl,
        archivePath
      );

      this.stage("install");
      this.info(`Extracting...`);

      const versionPrefix = this.getVersionPrefix(latestVersion);
      await sf.wipe(versionPrefix);
      await unzip({
        archivePath,
        destination: versionPrefix,
        logger: this.logger,
        onProgress: info => {
          let newInfo = {
            ...info,
            progress: extractStart + info.progress * extractWeight,
          };
          this.emitProgress(newInfo);
        },
      });
      await this.writeInstallMarker(latestVersion);

      this.info(`Validating...`);
      if (!await this.isVersionValid(latestVersion)) {
        throw new Error(
          `Could not validate version ${latestVersion} of ${this.name}`
        );
      }
    }

    this.info(`Validated!`);
    await this.writeChosenVersion(latestVersion);
    this.refreshPrefix(latestVersion);
  }

  async hasInstallMarker(version: Version): Promise<boolean> {
    const installedMarkerPath = this.getInstalledMarkerPath(version);
    try {
      await sf.readFile(installedMarkerPath, { encoding: "utf8" });
      return true;
    } catch (e) {}

    return false;
  }

  async writeInstallMarker(version: Version) {
    const installedMarkerPath = this.getInstalledMarkerPath(version);
    await sf.writeFile(installedMarkerPath, `installed on ${new Date()}`, {
      encoding: "utf8",
    });
  }

  async getChosenVersion(): Promise<Version | null> {
    try {
      const contents = await sf.readFile(this.getChosenMarkerPath(), {
        encoding: "utf8",
      });
      const version = contents.trim();
      return version;
    } catch (e) {
      // ignore
    }
    return null;
  }

  async writeChosenVersion(version: Version): Promise<void> {
    this.info(`Marking ${version} as chosen version`);
    await sf.writeFile(this.getChosenMarkerPath(), version, {
      encoding: "utf8",
    });
  }

  async cleanOldVersions() {
    const presentVersions = await this.getPresentVersions();
    const chosenVersion = await this.getChosenVersion();

    for (const ov of presentVersions) {
      if (ov == chosenVersion) {
        continue;
      }

      this.info(`Removing obsolete version ${ov}`);
      try {
        await sf.wipe(this.getVersionPrefix(ov));
      } catch (e) {
        this.warn(`Could not remove version ${ov}: ${e}`);
      }
    }
  }

  async getPresentVersions(): Promise<Version[]> {
    let presentVersions: Version[] = [];
    let subdirs = await readdir(this.getVersionsDir());
    for (const subdir of subdirs) {
      const version = subdir as Version;
      presentVersions.push(version);
    }

    this.debug(`Present versions: ${presentVersions.join(", ")}`);
    return presentVersions;
  }

  async isVersionValid(v: Version): Promise<boolean> {
    try {
      await Promise.race([
        this.formula.sanityCheck(this.getVersionPrefix(v)),
        (async () => {
          await delay(sanityCheckTimeout);
          throw new Error("timed out");
        })(),
      ]);
    } catch (e) {
      this.warn(`Sanity check failed: ${e.message}`);
      return false;
    }

    return true;
  }
}
