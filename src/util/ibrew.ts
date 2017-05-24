
import * as ospath from "path";
import {app} from "electron";
import * as os from "../os";
import sf from "../os/sf";
import spawn from "../os/spawn";

import {partial} from "underscore";

import {Logger} from "../logger";

import extract from "./extract";
import targz from "./targz";

import formulas, {IFormulaSpec} from "./ibrew/formulas";
import {IVersionCheck} from "./ibrew/formulas";

import version from "./ibrew/version";

import net from "./ibrew/net";
import {
  downloadToFile, getChecksums, ensureChecksum,
  ChecksumAlgo, IChecksums,
} from "../net";

import {EventEmitter} from "events";

interface IBrewOpts {
  logger: Logger;
}

const defaultVersionCheck = {
  args: ["-V"],
  parser: /([a-zA-Z0-9\.]+)/,
};

interface IAugmentedPaths {
  [path: string]: boolean;
}

interface IFetchOpts {
  logger: Logger;
  onStatus: (status: string, extra?: any[]) => void;
}

const self = {
  fetch: async function (opts: IFetchOpts, name: string) {
    const noop = (): any => null;
    const {onStatus = noop} = opts;
    const logger = opts.logger.child({name: "ibrew"});

    const formula = formulas[name];
    if (!formula) {
      throw new Error(`Unknown formula: ${name}`);
    }

    const osWhitelist = formula.osWhitelist;
    if (osWhitelist && osWhitelist.indexOf(net.goos()) === -1) {
      return;
    }

    this.augmentPath(opts, formula.subfolder);

    const skipUpgradeWhen = formula.skipUpgradeWhen;
    if (skipUpgradeWhen) {
      const reason = await skipUpgradeWhen({
        binPath: self.binPath(),
      });
      if (reason) {
        logger.warn(`${name}: skipping upgrade check (${JSON.stringify(reason)})`);
        return;
      }
    }

    const channel = net.channel(name);

    const downloadVersion = async function (v: string) {
      const archiveName = self.archiveName(name);
      const archivePath = ospath.join(self.binPath(), archiveName);
      const archiveUrl = `${channel}/v${v}/${archiveName}`;
      onStatus("download", ["login.status.dependency_install", {name, version: v}]);
      logger.info(`${name}: downloading '${v}' from ${archiveUrl}`);

      await downloadToFile(opts.logger, archiveUrl, archivePath);

      let algo: ChecksumAlgo;
      let sums: IChecksums;

      for (algo of net.CHECKSUM_ALGOS) {
        try {
          sums = await getChecksums(opts.logger, `${channel}/v${v}`, algo);
          break;
        } catch (e) {
          logger.warn(`${name}: couldn't get ${algo} hashes (${e.message || "" + e})`);
        }
      }

      if (sums && sums[archiveName]) {
        await ensureChecksum(opts.logger, {
          algo,
          expected: sums[archiveName].hash,
          file: archivePath,
        });
      } else {
        logger.warn(`${name}: no hashes found, skipping integrity check`);
      }

      if (formula.format === "executable") {
        logger.info(`${name}: installed!`);
      } else if (formula.format === "7z") {
        logger.info(`${name}: extracting ${formula.format} archive`);
        await extract.extract({
          logger,
          emitter: new EventEmitter(),
          archivePath,
          destPath: self.binPath(),
        });
        logger.info(`${name}: cleaning up ${formula.format} archive`);
        await sf.wipe(archivePath);
      } else if (formula.format === "tar.gz") {
        logger.info(`${name}: extracting ${formula.format} archive`);
        await targz.extract({
          archivePath,
          destPath: self.binPath(),
        });
        logger.info(`${name}: cleaning up ${formula.format} arhcive`);
        await sf.wipe(archivePath);
      } else {
        throw new Error(`unsupported ibrew formula format: ${formula.format}`);
      }

      const {sanityCheck} = formula;
      if (sanityCheck) {
        logger.info(`${name}: running sanity check ${JSON.stringify(sanityCheck)}`);

        const sanityRes = await spawn.exec(sanityCheck);
        if (sanityRes.code !== 0) {
          throw new Error(`sanity check for ${name} failed with code ${sanityRes.code}` +
            `, out = ${sanityRes.out}, err = ${sanityRes.err}`);
        }
      }
      logger.info(`${name}: installed!`);
    };

    onStatus("stopwatch", ["login.status.dependency_check"]);
    const getLatestVersion = partial(net.getLatestVersion, channel);

    const localVersion = await self.getLocalVersion(name);

    if (!localVersion) {
      logger.info(`${name}: missing, downloading latest`);
      const latestVersion = await getLatestVersion();
      return await downloadVersion(latestVersion);
    }

    let latestVersion: string;
    try {
      latestVersion = await getLatestVersion();
    } catch (err) {
      logger.warn(`${name}: cannot get latest version, skipping: ${err.message || err}`);
      return;
    }

    if (version.equal(localVersion, latestVersion) ||
        localVersion === "head") {
      logger.info(`${name}: have latest (${localVersion})`);
      return;
    }

    logger.info(`${name}: upgrading '${localVersion}' => '${latestVersion}'`);
    await downloadVersion(latestVersion);
  },

  archiveName: (name: string) => {
    let formula = formulas[name];

    if (formula.format === "7z") {
      return `${name}.7z`;
    } else if (formula.format === "tar.gz") {
      return `${name}.tar.gz`;
    } else if (formula.format === "executable") {
      return `${name}${self.ext()}`;
    } else {
      throw new Error(`Unknown formula format: ${formula.format}`);
    }
  },

  getLocalVersion: async function (name: string): Promise<string> {
    const formula = formulas[name] as IFormulaSpec;
    const {versionCheck = {}} = formula;

    const check: IVersionCheck = {...defaultVersionCheck, ...versionCheck};

    try {
      const command = check.command ? check.command : name;
      const extraOpts = {} as any;
      if (check.cleanPath) {
        extraOpts.env = {
          ...process.env,
          PATH: this.binPath(),
        };
      }
      const info = await os.assertPresence(command, check.args, check.parser, extraOpts);
      return version.normalize(info.parsed);
    } catch (err) {
      console.log(`[ibrew] While checking version for ${name}: ${err.message}`); // tslint:disable-line:no-console

      // not present
      return null;
    }
  },

  binPath: () => ospath.join(app.getPath("userData"), "bin"),

  ext: () => (os.platform() === "win32") ? ".exe" : "",

  augmentedPaths: {} as IAugmentedPaths,

  augmentPath: function (opts: IBrewOpts, subfolder: string): string {
    const {logger} = opts;
    let binPath = self.binPath();
    if (subfolder) {
      binPath = ospath.join(binPath, subfolder);
    }
    if (self.augmentedPaths[binPath]) {
      return;
    }
    self.augmentedPaths[binPath] = true;
    logger.info(`Augmenting $PATH: ${binPath}`);

    process.env.PATH = `${binPath}${ospath.delimiter}${process.env.PATH}`;
    return binPath;
  },
};

export default self;
