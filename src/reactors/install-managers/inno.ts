import spawn from "../../os/spawn";
import findUninstallers from "./find-uninstallers";

import { Cancelled } from "../../types";
import { ICoreInstallOpts, IInstallManager } from "./core";

// InnoSetup docs: http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline

function getLogPath(operation: string, installerPath: string) {
  return `${installerPath}.${operation}.log.txt`;
}

async function install(opts: ICoreInstallOpts) {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "nsis/install" });

  ctx.emitProgress({ progress: -1 });

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
  logger.info(`inno installer exited with code ${code}`);
}

async function uninstall(opts: ICoreInstallOpts) {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "nsis/install" });
  ctx.emitProgress({ progress: -1 });

  const { destPath } = opts;
  const uninstallers = await findUninstallers(destPath);

  if (uninstallers.length === 0) {
    // FIXME: we should have better options here
    throw new Cancelled("could not find uninstaller");
  }

  // FIXME: see nsis for other FIXMEs
  for (let unins of uninstallers) {
    logger.info(`running inno uninstaller ${unins}`);
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
    logger.info(`inno uninstaller exited with code ${code}`);

    if (code !== 0) {
      logger.error("uninstaller failed, cancelling uninstallation");
      throw new Cancelled();
    }
  }
}

const manager: IInstallManager = { install, uninstall };
export default manager;
