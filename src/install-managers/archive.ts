import { extract } from "../util/extract";
import { elapsed } from "../format/datetime";

import {
  IInstallManager,
  IInstallOpts,
  IUninstallOpts,
  IInstallResult,
  IUninstallResult,
} from "./common/core";

import { basename } from "path";

import bustGhosts from "./common/bust-ghosts";

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx, archivePath, destPath } = opts;
  const logger = opts.logger.child({ name: "archive/install" });

  logger.info(`Installing '${basename(archivePath)}'`);
  const startTime = Date.now();

  const extractResult = await extract({ ctx, logger, archivePath, destPath });
  const newFiles = extractResult.files;
  await bustGhosts({ ctx, logger, destPath, newFiles });

  const endTime = Date.now();
  logger.info(`extracted in ${elapsed(startTime, endTime)}`);

  logger.debug(`a debug message`);
  logger.warn(`this one's a warning`);
  logger.error(`ooh, an error, starting to get serious`);
  logger.fatal(`this is a fatal error, we don't use them really`);
  throw new Error("This is a test error to show off the dialog");

  return {
    files: newFiles,
  };
}

async function uninstall(opts: IUninstallOpts): Promise<IUninstallResult> {
  const logger = opts.logger.child({ name: "archive/uninstall" });
  logger.info(`nothing to do`);

  return {};
}

// async function handleNested(opts: ICoreInstallOpts, onlyFile: string) {
//   const { ctx, logger, runtime } = opts;

//   // zipped installers need love too
//   const installerName = await getInstallerType({
//     ctx,
//     logger,
//     runtime,
//     target: onlyFile,
//   });

//   if (installerName === "unknown") {
//     return null;
//   }

//   logger.info(`found nested installer '${installerName}': ${onlyFile}`);
//   await coreOperate(
//     {
//       ...opts,
//       archivePath: onlyFile,
//     },
//     "install",
//     installerName,
//   );

//   return { deployed: true };
// }

const manager: IInstallManager = { install, uninstall };
export default manager;
