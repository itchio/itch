import spawn from "../os/spawn";

import {
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
  IInstallManager,
} from "./common/core";

import getBlessing from "./common/get-blessing";
import saveAngels from "./common/save-angels";

import { findWhere } from "underscore";

import butler, {
  IWindowsInstallerError,
  IMsiInstallOpts,
} from "../util/butler";

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx, logger, runtime } = opts;
  if (runtime.platform !== "windows") {
    throw new Error("MSI installers are only supported on Windows");
  }

  const msiInfo = await butler.msiInfo({ ctx, logger, file: opts.archivePath });

  const result = await saveAngels(opts, async () => {
    ctx.emitProgress({ progress: -1 });
    let errors: IWindowsInstallerError[];
    let butlerOpts: IMsiInstallOpts = {
      ctx,
      logger,
      file: opts.archivePath,
      target: opts.destPath,
      onValue: value => {
        if (value.type === "windowsInstallerError") {
          errors.push(value.value);
        }
      },
    };

    let succeeded = false;
    try {
      await butler.msiInstall(butlerOpts);
      succeeded = true;
    } catch (e) {
      logger.warn(`During unprivileged MSI install: ${e.stack}`);
    }

    if (!succeeded && findWhere(errors, { code: 1925 })) {
      /**
       * 1925 = You do not have sufficient privileges to complete
       * this installation for all users of the machine. Log on as
       * administrator and then retry this installation.
       */

      errors = [];
      butlerOpts = {
        ...butlerOpts,
        elevate: true,
      };

      await butler.msiInstall(butlerOpts);
    }
  });

  return {
    files: result.files,
    receiptOut: {
      msiProductCode: msiInfo.productCode,
    },
  };
}

export async function uninstall(
  opts: IUninstallOpts & IElevatedOpts,
): Promise<IUninstallResult> {
  const { ctx, runtime, elevated } = opts;

  if (runtime.platform !== "windows") {
    throw new Error("MSI files are only supported on Windows");
  }

  ctx.emitProgress({ progress: -1 });

  const archivePath = opts.archivePath;
  const destPath = opts.destPath;
  const logger = opts.logger;

  const msiCmd = elevated ? "--elevated-uninstall" : "--uninstall";

  if (elevated) {
    await getBlessing(opts, "uninstall");
  }

  const code = await spawn({
    command: "elevate",
    args: getArgs(msiCmd, archivePath, destPath),
    onToken: token => logger.info(token),
    onErrToken: token => logger.warn(token),
    ctx,
    logger,
  });

  if (code !== 0) {
    if (code === 1603 && !opts.elevated) {
      logger.warn("msi uninstaller exited with 1603, retrying elevated");
      return await uninstall({ ...opts, elevated: true });
    }
    throw new Error(`msi uninstaller exited with code ${code}`);
  }

  logger.info("msi uninstaller completed successfully");
}

const manager: IInstallManager = { install, uninstall };
export default manager;
