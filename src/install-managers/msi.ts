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
  IMsiUninstallOpts,
} from "../util/butler";

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx, runtime } = opts;
  const logger = opts.logger.child({ name: "msi-uninstall" });

  if (runtime.platform !== "windows") {
    throw new Error("MSI installers are only supported on Windows");
  }

  const msiInfo = await butler.msiInfo({ ctx, logger, file: opts.archivePath });

  const result = await saveAngels(opts, async () => {
    ctx.emitProgress({ progress: -1 });
    let errors: IWindowsInstallerError[] = [];
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

    let needElevated = false;
    try {
      await butler.msiInstall(butlerOpts);
    } catch (e) {
      /**
       * 1925 = You do not have sufficient privileges to complete
       * this installation for all users of the machine. Log on as
       * administrator and then retry this installation.
       */
      needElevated = !!findWhere(errors, { code: 1925 });
      if (needElevated) {
        logger.info(`Must be administrator, re-trying install elevated`);
      } else {
        logger.warn(`During unprivileged MSI install: ${e.message}`);
      }
    }

    if (needElevated) {
      errors = [];
      butlerOpts = {
        ...butlerOpts,
        elevate: true,
      };

      await getBlessing(opts, "install");
      await butler.msiInstall(butlerOpts);
    }

    // TODO: if succeeded but folder is empty, tell user about it.
    // it's going to be a hard message to get right...
    // it could be already installed, or it could be an MSI that
    // just doesn't give a hoot about the target install folder
  });

  return {
    files: result.files,
    receiptOut: {
      msiProductCode: msiInfo.productCode,
    },
  };
}

export async function uninstall(
  opts: IUninstallOpts,
): Promise<IUninstallResult> {
  const { ctx, runtime, receiptIn } = opts;
  const logger = opts.logger.child({ name: "msi-uninstall" });

  if (runtime.platform !== "windows") {
    throw new Error("MSI files are only supported on Windows");
  }

  const { archivePath } = opts;

  let productCode: string;
  if (receiptIn && receiptIn.msiProductCode) {
    productCode = receiptIn.msiProductCode;
  }

  if (!productCode) {
    // FIXME: when we make archivePath optional for uninstalls,
    // this is where we'd ask for it
    productCode = archivePath;
  }

  ctx.emitProgress({ progress: -1 });

  let errors: IWindowsInstallerError[] = [];
  let butlerOpts: IMsiUninstallOpts = {
    ctx,
    logger,
    productCode,
    onValue: value => {
      if (value.type === "windowsInstallerError") {
        errors.push(value.value);
      }
    },
  };

  let needElevated = false;
  try {
    await butler.msiUninstall(butlerOpts);
  } catch (e) {
    /*
     * Error 1730. You must be an Administrator to remove this
     * application. To remove this application, you can log on as an
     * Administrator, or contact your technical support group for assistance.
     */
    needElevated = !!findWhere(errors, { code: 1730 });
    if (needElevated) {
      logger.info(`Must be administrator, re-trying uninstall elevated`);
    } else {
      logger.warn(`During unprivileged MSI uninstall: ${e.stack}`);
    }
  }

  if (needElevated) {
    errors = [];
    butlerOpts = {
      ...butlerOpts,
      elevate: true,
    };

    await getBlessing(opts, "uninstall");
    await butler.msiUninstall(butlerOpts);
  }

  return {};
}

const manager: IInstallManager = { install, uninstall };
export default manager;
