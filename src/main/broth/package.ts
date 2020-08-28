import { actions } from "common/actions";
import urls from "common/constants/urls";
import { Logger } from "common/logger";
import { PackageState, ProgressInfo, Store } from "common/types";
import { MinimalContext } from "main/context";
import spawn from "main/os/spawn";
import { dirname, join } from "path";
import querystring from "querystring";
import * as semver from "semver";
import which from "which";
import { downloadToFileWithRetry } from "main/net/download";
import { request } from "main/net/request/metal-request";
import * as sf from "main/os/sf";
import { mkdir, readdir } from "main/os/sf";
import { delay } from "main/reactors/delay";
import formulas, { FormulaSpec } from "main/broth/formulas";
import { goarch, goos } from "main/broth/platform";
import { unzip } from "main/broth/unzip";

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

export interface EnsureOpts {
  // Set to true if this is a startup ensure
  startup?: boolean;

  logger: Logger;
}

export interface UpgradeOpts {
  logger: Logger;
}

export interface PackageLike {
  ensure(opts: EnsureOpts): Promise<void>;
  upgrade(opts: UpgradeOpts): Promise<void>;
}

export class Package implements PackageLike {
  private store: Store;
  private formula: FormulaSpec;
  private prefix: string;
  private name: string;
  private channel: string;
  private baseURL: string;
  private semverConstraint: string;

  constructor(store: Store, prefix: string, name: string) {
    this.store = store;
    this.prefix = prefix;
    this.name = name;
    this.formula = formulas[name];
    if (!this.formula) {
      throw new Error(`No spec for formula: (${this.name})`);
    }
    let channel = platform;
    if (this.formula.transformChannel) {
      channel = this.formula.transformChannel(channel);
    }
    this.channel = channel;
    if (this.formula.getSemverConstraint) {
      this.semverConstraint = this.formula.getSemverConstraint();
    }
    this.baseURL = `${urls.brothRepo}/${name}/${channel}`;
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
  async getLatestVersion(logger: Logger): Promise<Version> {
    if (this.semverConstraint) {
      logger.debug(
        `Trying to satisfy semver constraint (${this.semverConstraint})`
      );
      const url = this.buildURL(`/versions`);
      logger.debug(`GET (${url})`);
      const res = await request("get", url, {});
      if (res.statusCode !== 200) {
        throw new Error(`got HTTP ${res.statusCode} while fetching (${url})`);
      }

      const versionsRes = JSON.parse(res.body) as VersionsRes;
      if (!versionsRes.versions) {
        throw new Error(
          `got invalid response from broth server: expected JSON object with 'versions' field, got: ${JSON.stringify(
            versionsRes
          )}`
        );
      }

      // already ordered from most recent to least recent
      for (const v of versionsRes.versions) {
        if (semver.satisfies(v, this.semverConstraint)) {
          return v;
        } else {
          logger.debug(`Ignoring (${v})`);
        }
      }

      throw new Error(
        `Could not find a version satisfying (${this.semverConstraint})`
      );
    } else {
      logger.debug("No semver constraint, going with /LATEST");
      const url = this.buildURL(`/LATEST`);
      logger.debug(`GET (${url})`);
      const res = await request("get", url, {});
      if (res.statusCode !== 200) {
        throw new Error(`got HTTP ${res.statusCode} while fetching (${url})`);
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

  shouldUseLocal(): boolean {
    return useLocals.indexOf(this.name) !== -1;
  }

  async ensure(opts: EnsureOpts) {
    const logger = this.makeLogger(opts.logger);
    if (this.shouldUseLocal()) {
      await this.ensureLocal(logger);
      return;
    }

    await mkdir(this.getVersionsDir());

    const chosenVersion = await this.getChosenVersion();
    if (chosenVersion) {
      const isValid = await this.isVersionValid(logger, chosenVersion);
      if (isValid) {
        logger.info(`(${chosenVersion}) is chosen and valid`);
        this.refreshPrefix(logger, chosenVersion);
        return;
      } else {
        logger.info(
          `(${chosenVersion}) is chosen but not valid, attempting install...`
        );
      }
    } else {
      logger.info(`No chosen version, attempting install...`);
    }

    if (opts.startup && !this.formula.requiredAtStartup) {
      logger.info(`No valid version, but not required at startup. Skipping`);
      return;
    }

    await this.upgrade({ logger: opts.logger });
  }

  async ensureLocal(logger) {
    logger.info(`Looking for local binary...`);

    const executablePath = await which(this.name);
    logger.info(`Found at (${executablePath})`);

    const { err } = await spawn.exec({
      logger,
      ctx: new MinimalContext(),
      command: executablePath,
      args: ["-V"],
    });
    const version = err;

    this.store.dispatch(
      actions.packageGotVersionPrefix({
        name: this.name,
        version,
        versionPrefix: dirname(executablePath),
      })
    );
  }

  getCurrentVersionPrefix(): string {
    return this.store.getState().broth.packages[this.name].versionPrefix;
  }

  refreshPrefix(logger: Logger, version: Version) {
    const newVersionPrefix = this.getVersionPrefix(version);
    const oldVersionPrefix = this.getCurrentVersionPrefix();

    if (newVersionPrefix !== oldVersionPrefix) {
      logger.info(`Switching to (${version})`);
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
  async upgrade(opts: UpgradeOpts) {
    const logger = this.makeLogger(opts.logger);
    if (this.shouldUseLocal()) {
      logger.info(`Using local, so, not upgrading.`);
      return;
    }

    if (this.upgradeLock) {
      throw new Error(`package (${this.name}) locked`);
    }
    try {
      this.upgradeLock = true;
      this.stage("assess");
      await this.doUpgrade(logger);
    } finally {
      this.upgradeLock = false;
      this.stage("idle");

      try {
        await sf.wipe(this.getDownloadsDir());
      } catch (e) {
        logger.warn(`While cleaning downloads dir: ${e.stack}`);
      }

      try {
        await this.cleanOldVersions(logger);
      } catch (e) {
        logger.warn(`While cleaning old versions: ${e.stack}`);
      }
    }
  }

  private stage(stage: PackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }

  private emitProgress(progressInfo: ProgressInfo) {
    this.store.dispatch(
      actions.packageProgress({ name: this.name, progressInfo })
    );
    this.store.dispatch(
      actions.setupOperationProgress({ progress: progressInfo })
    );
  }

  private async doUpgrade(logger: Logger) {
    let latestVersion: Version;
    try {
      latestVersion = await this.getLatestVersion(logger);
    } catch (e) {
      logger.warn(`While checking for latest version: ${e.stack}`);
      throw new Error(
        `Could not retrieve latest version of (${this.name}): ${e.message}`
      );
    }
    logger.info(`Latest is (${latestVersion})`);

    if (
      this.getVersionPrefix(latestVersion) === this.getCurrentVersionPrefix()
    ) {
      logger.info(`Already the active version, nothing to do`);
      return;
    }

    if (await this.isVersionValid(logger, latestVersion)) {
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
      logger.info(`Downloading (${this.name})@(${latestVersion})`);
      logger.info(`...from (${archiveUrl})`);
      logger.info(`...to (${archivePath})`);

      await downloadToFileWithRetry(
        (info) => {
          let newInfo = {
            ...info,
            progress: downloadStart + info.progress * downloadWeight,
          };
          this.emitProgress(newInfo);
        },
        logger,
        archiveUrl,
        archivePath
      );
      logger.info(`Download completed.`);

      this.stage("install");
      logger.info(`Extracting...`);

      const versionPrefix = this.getVersionPrefix(latestVersion);
      await sf.wipe(versionPrefix);
      await unzip({
        archivePath,
        destination: versionPrefix,
        logger,
        onProgress: (info) => {
          let newInfo = {
            ...info,
            progress: extractStart + info.progress * extractWeight,
          };
          this.emitProgress(newInfo);
        },
      });
      await this.writeInstallMarker(latestVersion);

      logger.info(`Validating...`);
      if (!(await this.isVersionValid(logger, latestVersion))) {
        throw new Error(
          `Could not validate version ${latestVersion} of ${this.name}`
        );
      }
    }

    logger.info(`Validated!`);
    await this.writeChosenVersion(logger, latestVersion);
    this.refreshPrefix(logger, latestVersion);
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

  async writeChosenVersion(logger: Logger, version: Version): Promise<void> {
    logger.info(`Marking (${version}) as chosen version`);
    await sf.writeFile(this.getChosenMarkerPath(), version, {
      encoding: "utf8",
    });
  }

  async cleanOldVersions(logger: Logger) {
    const presentVersions = await this.getPresentVersions(logger);
    const chosenVersion = await this.getChosenVersion();

    for (const ov of presentVersions) {
      if (ov == chosenVersion) {
        continue;
      }

      logger.info(`Removing obsolete version (${ov})`);
      try {
        await sf.wipe(this.getVersionPrefix(ov));
      } catch (e) {
        logger.warn(`Could not remove version (${ov}): ${e}`);
      }
    }
  }

  async getPresentVersions(logger: Logger): Promise<Version[]> {
    let presentVersions: Version[] = [];
    let subdirs = await readdir(this.getVersionsDir());
    for (const subdir of subdirs) {
      const version = subdir as Version;
      presentVersions.push(version);
    }

    logger.debug(`Present versions: ${presentVersions.join(", ")}`);
    return presentVersions;
  }

  async isVersionValid(logger: Logger, v: Version): Promise<boolean> {
    const ctx = new MinimalContext();
    const { formula } = this;
    const { sanityCheck } = formula;
    const versionPrefix = this.getVersionPrefix(v);
    try {
      let t1 = Date.now();
      await Promise.race([
        sanityCheck(ctx, logger, versionPrefix),
        (async () => {
          await delay(sanityCheckTimeout);
          let t2 = Date.now();
          throw new Error(
            `Sanity check timed out after ${(t2 - t1).toFixed()}ms`
          );
        })(),
      ]);
    } catch (e) {
      logger.warn(`Sanity check failed: ${e.message}`);
      return false;
    } finally {
      ctx.tryAbort().catch((e) => {
        logger.warn(`While aborting validation context: ${e.stack}`);
      });
    }

    return true;
  }

  private makeLogger(parentLogger: Logger): Logger {
    return parentLogger.childWithName(`📦 ${this.name}`);
  }
}
