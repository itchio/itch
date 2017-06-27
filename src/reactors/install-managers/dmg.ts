import butler from "../../util/butler";
import deploy from "../../util/deploy";
import spawn from "../../os/spawn";

import archive from "./archive";

import { resolve } from "path";

import { devNull } from "../../logger";

import { Cancelled } from "../../types";
import { ICoreInstallOpts, IInstallManager } from "./core";

const HFS_RE = /(\S*)\s*(Apple_HFS)?\s+(.*)\s*$/;

async function install(opts: ICoreInstallOpts) {
  const { ctx, archivePath } = opts;
  const logger = opts.logger.child({ name: "install/dmg" });

  logger.info(`Preparing installation of '${archivePath}'`);
  ctx.emitProgress({ progress: -1 });

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
    throw new Error(`hdiutil info failed with code ${code}`);
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
        throw new Error(`hdiutil detach failed with code ${code}`);
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
    throw new Error(`hdiutil convert failed with code ${code}`);
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
    throw new Error(`Failed to mount image, with code ${code}`);
  }

  if (!mountpoint) {
    throw new Error("Failed to mount image (no mountpoint)");
  }

  await deploy({
    ctx,
    caveId: opts.caveId,
    destPath: opts.destPath,
    stagePath: mountpoint,
  });

  const cleanup = async function() {
    logger.info(`Detaching cdr file ${cdrPath}`);
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
      throw new Error(`Failed to mount image, with code ${code}`);
    }

    logger.info(`Removing cdr file ${cdrPath}`);
    await butler.wipe(cdrPath, {
      ctx,
      logger: devNull,
    });
  };

  logger.info("Launching cleanup asynchronously...");
  cleanup();
}

async function uninstall(opts: ICoreInstallOpts) {
  await archive.uninstall(opts);
}

const manager: IInstallManager = { install, uninstall };
export default manager;
