import * as ospath from "path";
import * as electron from "electron";

import * as os from "../os";
import * as sf from "../os/sf";
import spawn from "../os/spawn";

import { partial } from "underscore";

import { Logger, devNull } from "../logger";
import Context from "../context";

import formulas, { IFormulaSpec } from "./ibrew/formulas";
import { IVersionCheck } from "./ibrew/formulas";

import version from "./ibrew/version";

import net from "./ibrew/net";
import {
  downloadToFile,
  getChecksums,
  ensureChecksum,
  ChecksumAlgo,
  IChecksums,
} from "../net";
import { createGunzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";

const defaultVersionCheck = {
  args: ["-V"],
  parser: /([a-zA-Z0-9\.]+)/,
};

interface IFetchOpts {
  logger: Logger;
  ctx: Context;
  onStatus: (status: string, extra?: any[]) => void;
}

export async function installFormula(opts: IFetchOpts, name: string) {
  const { ctx } = opts;
  const noop = (): any => null;
  const { onStatus = noop } = opts;
  const logger = opts.logger.child({ name: "ibrew" });

  const formula = formulas[name];
  if (!formula) {
    throw new Error(`Unknown formula: ${name}`);
  }

  const channel = net.channel(name);

  const downloadVersion = async function(v: string) {
    const archiveName = getArchiveName(name);
    const archivePath = ospath.join(getBinPath(), archiveName);
    const archiveUrl = `${channel}/v${v}/${archiveName}`;
    onStatus("download", [
      "login.status.dependency_install",
      { name, version: v },
    ]);
    logger.info(`fetching ${name}@${v} from ${archiveUrl}`);

    await downloadToFile(opts.logger, archiveUrl, archivePath);

    let algo: ChecksumAlgo;
    let sums: IChecksums;

    for (algo of net.CHECKSUM_ALGOS) {
      try {
        sums = await getChecksums(opts.logger, `${channel}/v${v}`, algo);
        break;
      } catch (e) {
        logger.warn(
          `${name}: couldn't get ${algo} hashes (${e.message || "" + e})`
        );
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

    if (formula.format === "gz") {
      logger.info(`${name}: extracting ${formula.format} archive`);
      let src = createReadStream(archivePath);
      let destName = `${name}${ext()}`;
      let destPath = ospath.join(getBinPath(), destName);

      await sf.mkdirp(ospath.dirname(destPath));
      const dst = createWriteStream(destPath);
      src.pipe(createGunzip()).pipe(dst);
      await sf.promised(dst);

      logger.info(`${name}: making ${formula.format} executable`);
      await sf.chmod(destPath, 0o755);

      logger.info(`${name}: cleaning up ${formula.format} archive`);
      await sf.wipe(archivePath);
    } else {
      throw new Error(`unsupported ibrew formula format: ${formula.format}`);
    }

    const { sanityCheck } = formula;
    if (sanityCheck) {
      logger.info(
        `${name}: running sanity check ${JSON.stringify(sanityCheck)}`
      );
      let { command, args } = sanityCheck;
      command = ospath.join(getBinPath(), command);

      const sanityRes = await spawn.exec({
        command,
        args,
        ctx,
        logger: devNull,
        opts: {
          cwd: getBinPath(),
        },
      });
      if (sanityRes.code !== 0) {
        throw new Error(
          `sanity check for ${name} failed with code ${sanityRes.code}` +
            `, out = ${sanityRes.out}, err = ${sanityRes.err}`
        );
      }
    }
    logger.info(`${name}: installed!`);
  };

  onStatus("stopwatch", ["login.status.dependency_check"]);
  const getLatestVersion = partial(net.getLatestVersion, channel);

  const localVersion = await getLocalVersion(ctx, name);

  if (!localVersion) {
    logger.info(`${name}: missing, downloading latest`);
    const latestVersion = await getLatestVersion();
    return await downloadVersion(latestVersion);
  }

  let latestVersion: string;
  try {
    latestVersion = await getLatestVersion();
  } catch (err) {
    logger.warn(
      `${name}: cannot get latest version, skipping: ${err.message || err}`
    );
    return;
  }

  if (version.equal(localVersion, latestVersion) || localVersion === "head") {
    logger.info(`✔ ${name}@${localVersion} is up-to-date`);
    return;
  }

  logger.info(`▲ upgrading ${name}@${localVersion} to ${latestVersion}`);
  await downloadVersion(latestVersion);
}

function getArchiveName(name: string) {
  let formula = formulas[name];

  if (formula.format === "gz") {
    return `${name}.gz`;
  } else {
    throw new Error(`Unknown formula format: ${formula.format}`);
  }
}

async function getLocalVersion(ctx: Context, name: string): Promise<string> {
  const formula = formulas[name] as IFormulaSpec;
  const { versionCheck = {} } = formula;

  const check: IVersionCheck = { ...defaultVersionCheck, ...versionCheck };

  try {
    let { command, args, parser } = check;
    command = ospath.join(getBinPath(), command);

    const extraOpts = {} as any;
    const info = await os.assertPresence(ctx, command, args, parser, extraOpts);
    return version.normalize(info.parsed);
  } catch (err) {
    console.log(`[ibrew] While checking version for ${name}: ${err.message}`);

    // not present
    return null;
  }
}

export function getBinPath() {
  const app = electron.app || electron.remote.app;
  return ospath.join(app.getPath("userData"), "bin");
}

function ext() {
  return os.platform() === "win32" ? ".exe" : "";
}
