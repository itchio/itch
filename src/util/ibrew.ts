import * as ospath from "path";
import * as yauzl from "yauzl";
import { promisify } from "util";
const yauzlOpen = promisify(yauzl.open) as (
  path: string,
  options: yauzl.Options
) => Promise<yauzl.ZipFile>;

import * as os from "../os";
import * as sf from "../os/sf";
import spawn from "../os/spawn";

import { partial } from "underscore";

import { Logger, devNull } from "../logger";
import { Context } from "../context";

import formulas, { IFormulaSpec } from "./ibrew/formulas";
import { IVersionCheck } from "./ibrew/formulas";

import { getBinPath } from "./ibrew/binpath";
import version from "./ibrew/version";

import net from "./ibrew/net";
import {
  downloadToFile,
  getChecksums,
  ensureChecksum,
  ChecksumAlgo,
  IChecksums,
} from "../net";
import { createWriteStream } from "fs";

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
    const versionDir = v === "head" ? v : `v${v}`;
    let archiveUrl = `${channel}/${versionDir}/${archiveName}`;
    if (v === "head") {
      // bust cloudflare cache
      archiveUrl += `?t=${Date.now()}`;
    }

    onStatus("download", ["login.status.finalizing_installation"]);
    logger.info(`downloading ${name}@${v} from ${archiveUrl}`);
    logger.info(`...to ${archivePath}`);

    let algo: ChecksumAlgo;
    let sums: IChecksums;

    for (algo of net.CHECKSUM_ALGOS) {
      try {
        sums = await getChecksums(
          opts.logger,
          `${channel}/${versionDir}`,
          algo
        );
        break;
      } catch (e) {
        logger.warn(
          `${name}: couldn't get ${algo} hashes (${e.message || "" + e})`
        );
      }
    }

    await downloadToFile(opts.ctx, opts.logger, archiveUrl, archivePath);

    if (sums && sums[archiveName]) {
      await ensureChecksum(opts.logger, {
        algo,
        expected: sums[archiveName].hash,
        file: archivePath,
      });
    } else {
      logger.warn(`${name}: no hashes found, skipping integrity check`);
    }

    if (formula.format === "zip") {
      logger.info(`${name}: extracting ${formula.format} archive`);

      const zipfile = await yauzlOpen(archivePath, { lazyEntries: true });
      zipfile.readEntry();
      await new Promise((resolve, reject) => {
        zipfile.on("entry", entry => {
          logger.info(`Got entry ${entry.fileName}`);
          if (/\/$/.test(entry.fileName)) {
            // Directory file names end with '/'.
            // Note that entires for directories themselves are optional.
            // An entry's fileName implicitly requires its parent directories to exist.
            zipfile.readEntry();
          } else {
            // file entry
            zipfile.openReadStream(entry, function(err, src) {
              (async () => {
                if (err) {
                  throw err;
                }

                const destPath = ospath.join(getBinPath(), entry.fileName);
                logger.info(`Extracting ${destPath}...`);

                await sf.mkdirp(ospath.dirname(destPath));
                const dst = createWriteStream(destPath);
                src.pipe(dst);
                await sf.promised(dst);
                await sf.chmod(destPath, 0o755);
              })()
                .catch(reject)
                .then(() => {
                  zipfile.readEntry();
                });
            });
          }
        });
        zipfile.on("end", entry => {
          resolve();
        });
      });
      logger.info(`${name}: Extraction successful!`);
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

  if (formula.format === "zip") {
    return `${name}.zip`;
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
