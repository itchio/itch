import spawn from "../../os/spawn";
import getBlessing from "./blessing";

import {
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
  IInstallManager,
} from "./core";

import switcheroo from "./switcheroo";

interface IElevatedOpts {
  /** if truthy, run as admin */
  elevated?: boolean;
}

function getLogPath(msiPath: string) {
  return `${msiPath}.log.txt`;
}

function getArgs(operation: string, msiPath: string, targetPath: string) {
  const logPath = getLogPath(msiPath);

  return ["--msiexec", operation, msiPath, targetPath, logPath];
}

// TODO: use butler msi facilities here

// TODO: new plan for installers:
// - start deploying
// - move current folder to a temp location (1 rename)
// - install to right location
// - merge files that weren't in the manifest
// ALSO: we shouldn't be walking if we don't have a manifest
// yet, otherwise we'll definitely remove save games!

async function install(
  inOpts: IInstallOpts & IElevatedOpts,
): Promise<IInstallResult> {
  await switcheroo(inOpts, async opts => {
    const { ctx, runtime } = opts;
    ctx.emitProgress({ progress: -1 });

    if (runtime.platform !== "windows") {
      throw new Error("MSI installers are only supported on Windows");
    }

    const { archivePath, destPath, logger, elevated } = opts;

    const msiCmd = elevated ? "--elevated-install" : "--install";

    if (elevated) {
      await getBlessing(opts, "install");
    }

    const code = await spawn({
      command: "elevate.exe",
      args: getArgs(msiCmd, archivePath, destPath),
      onToken: token => logger.info(token),
      onErrToken: token => logger.warn(token),
      ctx,
      logger,
    });

    if (code !== 0) {
      if (code === 1603 && !elevated) {
        logger.warn("msi installer exited with 1603, retrying elevated");
        return await install({ ...opts, elevated: true });
      }
      throw new Error(`msi installer exited with code ${code}`);
    }

    logger.info("msi installer completed successfully");
  });
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
