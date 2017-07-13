import spawn from "../../os/spawn";

import { ICoreInstallOpts, IInstallManager } from "./core";

function getLogPath(msiPath: string) {
  return `${msiPath}.log.txt`;
}

function getArgs(operation: string, msiPath: string, targetPath: string) {
  const logPath = getLogPath(msiPath);

  return ["--msiexec", operation, msiPath, targetPath, logPath];
}

async function install(opts: ICoreInstallOpts): Promise<void> {
  const { ctx, runtime } = opts;
  ctx.emitProgress({ progress: -1 });

  if (runtime.platform !== "windows") {
    throw new Error("MSI installers are only supported on Windows");
  }

  const { archivePath, destPath, logger, elevated } = opts;

  // FIXME: wait for blessing if elevated
  const msiCmd = elevated ? "--elevated-install" : "--install";

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
}

export async function uninstall(opts: ICoreInstallOpts): Promise<void> {
  const { ctx, runtime } = opts;

  if (runtime.platform !== "windows") {
    throw new Error("MSI files are only supported on Windows");
  }

  ctx.emitProgress({ progress: -1 });

  const archivePath = opts.archivePath;
  const destPath = opts.destPath;
  const logger = opts.logger;

  // FIXME: wait for blessing if elevated
  const msiCmd = opts.elevated ? "--elevated-uninstall" : "--uninstall";

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
