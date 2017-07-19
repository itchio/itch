import { Logger, devNull } from "../../logger";
import Context from "../../context";

import spawn from "../../os/spawn";
import butler from "../../util/butler";

import { InstallerType, IRuntime } from "../../types";

interface IGetInstallerTypeOpts {
  ctx: Context;
  runtime: IRuntime;
  logger: Logger;
  target: string;
}

const installerForExt: {
  [ext: string]: InstallerType;
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
  // Books!
  pdf: "naked",
  // Known naked
  jar: "naked",
  unitypackage: "naked",
  naked: "naked",
  // some html games provide a single raw html file
  html: "naked",
};

const EXT_RE = /\.([0-9a-z]+)$/i;

function getExtension(path: string) {
  const matches = EXT_RE.exec(path);
  if (matches && matches[1]) {
    return matches[1].toLowerCase();
  }
  return null;
}

export default async function getInstallerType(
  opts: IGetInstallerTypeOpts,
): Promise<InstallerType> {
  const { ctx, logger, target } = opts;

  if (!target) {
    logger.warn("no target specified, cannot determine installer type");
    return "unknown";
  }

  const ext = getExtension(target);

  let installerName = installerForExt[ext];
  if (!installerName) {
    const candidate = await butler.configureSingle({
      path: target,
      logger,
      ctx,
    });

    if (candidate) {
      switch (candidate.flavor) {
        case "windows":
          if (
            candidate &&
            candidate.windowsInfo &&
            candidate.windowsInfo.installerType
          ) {
            installerName = candidate.windowsInfo
              .installerType as InstallerType;
            logger.info(
              `${target}: windows installer of type ${installerName}`,
            );
          } else {
            installerName = "naked";
            logger.info(
              `${target}: native windows executable, but not an installer`,
            );
          }
          break;
        case "macos":
          installerName = "naked";
          logger.info(`${target}: native macOS executable`);
          break;
        case "linux":
          installerName = "naked";
          logger.info(`${target}: native linux executable`);
          break;
        case "script":
          installerName = "naked";
          logger.info(`${target}: script`);
          if (candidate.scriptInfo && candidate.scriptInfo.interpreter) {
            logger.info(
              `...with interpreter ${candidate.scriptInfo.interpreter}`,
            );
          }
          break;
        case "windows-script":
          installerName = "naked";
          logger.info(`${target}: windows script`);
          break;
        default:
          logger.warn(
            `${target}: no extension and not an executable, seeing what sticks`,
          );
          installerName = await seeWhatSticks(opts);
          break;
      }
    }
  }

  return installerName;
}

async function seeWhatSticks(
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

    return "unknown";
  }
}
