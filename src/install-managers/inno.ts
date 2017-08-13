import spawn from "../os/spawn";

import {
  IInstallManager,
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
} from "./common/core";

import findUninstallers from "./common/find-uninstallers";
import saveAngels from "./common/save-angels";

// InnoSetup docs: http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline

function getLogPath(operation: string, installerPath: string) {
  return `${installerPath}.${operation}.log.txt`;
}

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "inno/install" });
  ctx.emitProgress({ progress: -1 });

  const result = await saveAngels(opts, async () => {
    const { archivePath, destPath } = opts;
    const logPath = getLogPath("i", archivePath);

    const code = await spawn({
      command: archivePath,
      args: [
        "/VERYSILENT", // run the installer silently
        "/SUPPRESSMSGBOXES", // don't show any dialogs
        "/NOCANCEL", // no going back
        "/NORESTART", // prevent installer from restarting system
        `/LOG=${logPath}`, // store log on disk
        `/DIR=${destPath}`, // install in apps directory if possible
      ],
      onToken: (token: string) => logger.info(token),
      ctx,
      logger,
    });

    if (code != 0) {
      throw new Error(`inno installer return error code ${code}`);
    }
  });

  return {
    files: result.files,
  };
}

async function uninstall(opts: IUninstallOpts): Promise<IUninstallResult> {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "inno/uninstall" });
  ctx.emitProgress({ progress: -1 });

  const { destPath } = opts;
  const uninstallers = await findUninstallers(ctx, logger, destPath, "inno");

  if (uninstallers.length === 0) {
    // this will give the option to wipe anyway
    throw new Error("No InnoSetup uninstaller found");
  }

  const unins = uninstallers[0];
  logger.info(`Running inno uninstaller ${unins}`);
  let code = await spawn({
    command: unins,
    args: [
      "/VERYSILENT", // be vewwy vewwy quiet
    ],
    opts: { cwd: destPath },
    onToken: (tok: string) => logger.info(`${unins}: ${tok}`),
    ctx,
    logger,
  });

  if (code !== 0) {
    throw new Error(`InnoSetup Uninstaller returned error ${code}`);
  }

  return {};
}

const manager: IInstallManager = { install, uninstall };
export default manager;
