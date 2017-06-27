import fnout, { SniffResult } from "fnout";
import { Logger, devNull } from "../../logger";
import Context from "../../context";

import spawn from "../../os/spawn";
import butler from "../../util/butler";

import { InstallerType, IRuntime } from "../../types";

import getExeInstallerType from "./get-exe-installer-type";

interface IGetInstallerTypeOpts {
  ctx: Context;
  runtime: IRuntime;
  logger: Logger;
  target: string;
}

const installerForExt: {
  [ext: string]: InstallerType | "exe";
} = {
  // Generic archives
  zip: "archive",
  gz: "archive",
  bz2: "archive",
  "7z": "archive",
  tar: "archive",
  xz: "archive",
  rar: "archive",
  // Apple disk images (DMG)
  dmg: "dmg",
  // Microsoft packages
  msi: "msi",
  // Inno setup, NSIS
  exe: "exe",
  // Books!
  pdf: "naked",
  // Known naked
  jar: "naked",
  unitypackage: "naked",
  naked: "naked",
  // some html games provide a single raw html file
  html: "naked",
};

export default async function getInstallerType(
  opts: IGetInstallerTypeOpts,
): Promise<InstallerType> {
  const { ctx, logger, target } = opts;

  if (!target) {
    logger.warn("no target specified, cannot determine installer type");
    return "unknown";
  }

  let type: SniffResult;
  if (/.(jar|unitypackage)$/i.test(target)) {
    logger.info(`known naked type for ${target}`);
    type = {
      ext: "naked",
    };
  }

  if (!type) {
    type = await fnout.path(target);
    logger.info(`sniffed type ${JSON.stringify(type)} for ${target}`);
  }

  if (!type) {
    logger.error(`fnout had nothing to say about ${target}`);
    return "unknown";
  }

  const { runtime } = opts;
  let installerName =
    installerForExt[type.ext] || (await seeWhatSticks(type, opts));

  if (installerName === "exe") {
    // exes need to be further classified
    installerName = await getExeInstallerType({
      ctx,
      logger,
      target,
      runtime,
    });
  }

  return installerName;
}

async function seeWhatSticks(
  type: SniffResult,
  opts: IGetInstallerTypeOpts,
): Promise<InstallerType> {
  const { ctx, logger, target } = opts;

  const code = await spawn({
    ctx,
    logger: devNull,
    command: "lsar",
    args: [target],
  });

  if (code === 0) {
    logger.info("unarchiver saves the day! it is an archive.");
    return "archive";
  } else {
    try {
      const fileResult = await butler.file({
        path: target,
        ctx,
        logger: devNull,
      });
      if (fileResult.type === "zip") {
        logger.info("butler saves the day! it's a file that ends with a zip");
        return "archive";
      } else {
        return "unknown";
      }
    } catch (e) {
      logger.warn(`while sniffing with butler: ${e.stack}`);
    }

    if (type.macExecutable || type.linuxExecutable) {
      logger.info("tis an executable, going with naked");
      return "naked";
    }

    return "unknown";
  }
}
