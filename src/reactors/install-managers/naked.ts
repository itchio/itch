import * as sf from "../../os/sf";
import butler from "../../util/butler";
import { join, basename } from "path";

import { IInstallManager, ICoreInstallOpts } from "./core";

export async function install(opts: ICoreInstallOpts) {
  const { ctx, archivePath, destPath } = opts;
  const logger = opts.logger.child({ name: "naked/install" });

  await sf.mkdir(destPath);

  const destFilePath = join(destPath, basename(archivePath));
  logger.info(`copying ${archivePath} to ${destFilePath}`);

  await butler.ditto(archivePath, destFilePath, {
    ctx,
    logger,
  });
}

export async function uninstall(opts: ICoreInstallOpts) {
  const { ctx, destPath } = opts;
  const logger = opts.logger.child({ name: "naked/uninstall" });

  logger.info(`nuking ${destPath}`);
  await butler.wipe(destPath, {
    ctx,
    logger,
  });
}

const manager: IInstallManager = { install, uninstall };
export default manager;
