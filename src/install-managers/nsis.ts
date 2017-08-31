import spawn from "../os/spawn";

import butler from "../util/butler";

import { join } from "path";

import { devNull } from "../logger";
import {
  IInstallManager,
  IInstallOpts,
  IInstallResult,
  IUninstallOpts,
  IUninstallResult,
} from "./common/core";

import getBlessing from "./common/get-blessing";
import findUninstallers from "./common/find-uninstallers";
import saveAngels from "./common/save-angels";
import { formatExitCode } from "../format/exit-code";

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

async function install(opts: IInstallOpts): Promise<IInstallResult> {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "nsis/install" });

  await getBlessing(opts, "install");
  ctx.emitProgress({ progress: -1 });

  const result = await saveAngels(opts, async () => {
    const { archivePath, destPath } = opts;

    const code = await spawn({
      command: "butler.exe",
      args: [
        "elevate",
        "--",
        archivePath,
        "/S", // run the installer silently
        "/NCRC", // disable CRC-check, we do hash checking ourselves
        `/D=${destPath}`,
      ],
      onToken: tok => logger.info(`${archivePath}: ${tok}`),
      ctx,
      logger,
    });

    if (code !== 0) {
      // TODO: standardize those errors so we can have dialogs for them
      // and have them be reported.
      throw new Error(`NSIS Installer exit code: ${formatExitCode(code)}`);
    }

    logger.info("elevate/nsis installer completed successfully");
  });

  return {
    files: result.files,
  };
}

async function uninstall(opts: IUninstallOpts): Promise<IUninstallResult> {
  const { ctx } = opts;

  const logger = opts.logger.child({ name: "nsis/uninstall" });
  ctx.emitProgress({ progress: -1 });

  const { destPath } = opts;
  const uninstallers = await findUninstallers(ctx, logger, destPath, "nsis");

  if (uninstallers.length === 0) {
    // this will give the option to wipe anyway
    throw new Error("No NSIS uninstaller found");
  }

  await getBlessing(opts, "uninstall");

  const unins = uninstallers[0];
  logger.info(`running nsis uninstaller ${unins}`);
  const code = await spawn({
    command: "butler.exe",
    args: [
      "elevate",
      "--",
      join(destPath, unins),
      "/S", // run the uninstaller silently
      `_?=${destPath}`, // specify uninstallation path
    ],
    opts: { cwd: destPath },
    onToken: (tok: string) => logger.info(`${unins}: ${tok}`),
    ctx,
    logger,
  });

  if (code !== 0) {
    throw new Error(`NSIS Uninstaller exit code: ${formatExitCode(code)}`);
  }

  return {};
}

const manager: IInstallManager = { install, uninstall };
export default manager;
