import butler from "../util/butler";
import spawn from "../os/spawn";

import { resolve } from "path";

import rootLogger, { devNull } from "../logger";

import {
  IInstallManager,
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
} from "./common/core";
import bustGhosts from "./common/bust-ghosts";
import { formatExitCode } from "../format/exit-code";

const HFS_RE = /(\S*)\s*(Apple_HFS)?\s+(.*)\s*$/;

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx, archivePath } = opts;
  const logger = opts.logger.child({ name: "install/dmg" });

  logger.info(`Preparing installation of '${archivePath}'`);
  ctx.emitProgress({ progress: -1 });

  // TODO: abstract away the cdr stuff
  const cdrPath = resolve(archivePath + ".cdr");

  let infoEntries: string[][] = [];
  let code = await spawn({
    command: "hdiutil",
    args: ["info"],
    split: "================================================",
    onToken: (tok: string) => {
      infoEntries.push(tok.split("\n"));
    },
    ctx,
    logger: devNull,
  });
  if (code !== 0) {
    throw new Error(`hdiutil info failed with code ${formatExitCode(code)}`);
  }

  for (const entry of infoEntries) {
    let imagePath: string;
    for (const line of entry) {
      let matches = /^image-path\s*:\s*(.*)\s*$/.exec(line);
      if (matches) {
        imagePath = matches[1];
        break;
      }
    }

    logger.info(`Found image ${imagePath}`);
    if (imagePath && imagePath === cdrPath) {
      let mountpoint: string;

      for (const line of entry) {
        if (/Apple_partition_scheme\s*$/.test(line)) {
          mountpoint = line.split(/\s/)[0];
          break;
        }
      }

      if (!mountpoint) {
        logger.warn(`Could not detach ${cdrPath}`);
        continue;
      }

      logger.info(`Trying to detach ${cdrPath}...`);
      code = await spawn({
        command: "hdiutil",
        args: ["detach", "-force", mountpoint],
        ctx,
        logger: devNull,
      });
      if (code !== 0) {
        throw new Error(
          `hdiutil detach failed with code ${formatExitCode(code)}`
        );
      }
    }
  }

  logger.info("Done looking for previously mounted images");
  logger.info(`Trying to unlink ${cdrPath}`);

  try {
    await butler.wipe(cdrPath, {
      ctx,
      logger: devNull,
    });
  } catch (e) {
    logger.warn(`Couldn't unlink ${cdrPath}: ${e}`);
  }

  logger.info(`Converting archive '${archivePath}' to CDR with hdiutil`);

  code = await spawn({
    command: "hdiutil",
    args: ["convert", archivePath, "-format", "UDTO", "-o", cdrPath],
    ctx,
    logger,
  });
  if (code !== 0) {
    throw new Error(`hdiutil convert failed with code ${formatExitCode(code)}`);
  }

  logger.info(`Attaching cdr file ${cdrPath}`);

  let device: string;
  let mountpoint: string;

  code = await spawn({
    command: "hdiutil",
    args: [
      "attach",
      "-nobrowse", // don't show up in Finder's device list
      "-noautoopen", // don't open Finder window with newly-mounted part
      "-noverify", // no integrity check (we do those ourselves)
      cdrPath,
    ],
    onToken: tok => {
      logger.info(`hdiutil attach: ${tok}`);
      let hfsMatches = HFS_RE.exec(tok);
      if (hfsMatches) {
        device = hfsMatches[1].trim();
        mountpoint = hfsMatches[3].trim();
        logger.info(`found dev / mountpoint: '${device}' '${mountpoint}'`);
      }
    },
    ctx,
    logger: devNull,
  });
  if (code !== 0) {
    throw new Error(`Failed to mount image, with code ${formatExitCode(code)}`);
  }

  if (!mountpoint) {
    throw new Error("Failed to mount image (no mountpoint)");
  }

  const files = [];
  const { destPath } = opts;

  await butler.ditto(mountpoint, destPath, {
    ctx,
    logger,
    onValue: val => {
      if (val.type === "entry") {
        files.push(val.path);
      }
    },
  });

  await bustGhosts({
    ctx,
    logger,
    destPath,
    newFiles: files,
  });

  const cleanup = async function() {
    rootLogger.info(`Detaching cdr file ${cdrPath}`);
    code = await spawn({
      command: "hdiutil",
      args: [
        "detach",
        "-force", // ignore opened files, etc.
        device,
      ],
      ctx,
      logger: devNull,
    });
    if (code !== 0) {
      throw new Error(
        `Failed to mount image, with code ${formatExitCode(code)}`
      );
    }

    rootLogger.info(`Removing cdr file ${cdrPath}`);
    await butler.wipe(cdrPath, {
      ctx,
      logger: devNull,
    });
  };

  logger.info("Launching cleanup asynchronously...");
  cleanup().catch(e => {
    rootLogger.info(`DMG cleanup error: ${e.stack}`);
  });

  return { files };
}

async function uninstall(opts: IUninstallOpts): Promise<IUninstallResult> {
  const logger = opts.logger;
  logger.info("Nothing to do");
  return {};
}

const manager: IInstallManager = { install, uninstall };
export default manager;
