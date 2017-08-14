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
    let removeAfterUsage = false;

    const { archivePath, destPath } = opts;
    let installerPath = archivePath;

    /*
     * FIXME: change downloads directory structure, instead of having:
     * - downloads/
     *   - 123.zip
     *   - 456
     * 
     * let's have:
     * - downloads/
     *   - 123/
     *     - Complete filename.zip
     *   - 456/
     *     - Another file.exe
     * 
     * and then we won't need that at all.
     */
    if (!/\.exe$/i.test(installerPath)) {
      // copy to temporary file, otherwise windows will refuse to open them
      // cf. https://github.com/itchio/itch/issues/322
      installerPath += ".exe";
      await butler.ditto(opts.archivePath, installerPath, {
        ctx,
        logger: devNull,
      });
      removeAfterUsage = true;
    }

    const code = await spawn({
      command: "butler.exe",
      args: [
        "elevate",
        "--",
        installerPath,
        "/S", // run the installer silently
        "/NCRC", // disable CRC-check, we do hash checking ourselves
        `/D=${destPath}`,
      ],
      onToken: tok => logger.info(`${installerPath}: ${tok}`),
      ctx,
      logger,
    });

    // FIXME: remove that too then
    if (removeAfterUsage) {
      await butler.wipe(installerPath, {
        ctx,
        logger: devNull,
      });
    }

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
