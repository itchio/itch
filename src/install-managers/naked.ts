import * as sf from "../os/sf";
import butler from "../util/butler";
import { join, basename } from "path";

import {
  IInstallManager,
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
} from "./common/core";

export async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx, archivePath, destPath } = opts;
  const logger = opts.logger.child({ name: "naked/install" });

  const archiveBaseName = basename(archivePath);

  await sf.mkdir(destPath);

  const destFilePath = join(destPath, archiveBaseName);
  logger.info(`Copying ${archiveBaseName}`);

  await butler.ditto(archivePath, destFilePath, {
    ctx,
    logger,
  });

  const files = [archiveBaseName];
  return { files };
}

export async function uninstall(
  opts: IUninstallOpts
): Promise<IUninstallResult> {
  const logger = opts.logger.child({ name: "naked/uninstall" });
  logger.info(`Nothing to do`);
  return {};
}

const manager: IInstallManager = { install, uninstall };
export default manager;
