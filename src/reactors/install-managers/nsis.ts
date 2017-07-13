import spawn from "../../os/spawn";
import findUninstallers from "./find-uninstallers";

import getBlessing from "./blessing";
import butler from "../../util/butler";

import { devNull } from "../../logger";
import { Cancelled } from "../../types";
import { IInstallManager, ICoreInstallOpts } from "./core";

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

async function install(opts: ICoreInstallOpts) {
  const { ctx } = opts;
  const logger = opts.logger.child({ name: "nsis/install" });

  await getBlessing(opts, "install");
  ctx.emitProgress({ progress: -1 });

  const { archivePath, destPath } = opts;
  let installerPath = archivePath;

  let removeAfterUsage = false;

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
    command: "elevate.exe",
    args: [
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
    throw new Error(`elevate / nsis installer exited with code ${code}`);
  }

  logger.info("elevate/nsis installer completed successfully");
}

async function uninstall(opts: ICoreInstallOpts) {
  const { ctx } = opts;

  const logger = opts.logger.child({ name: "nsis/uninstall" });
  ctx.emitProgress({ progress: -1 });

  const { destPath } = opts;
  const uninstallers = await findUninstallers(destPath);

  if (uninstallers.length === 0) {
    // FIXME: we should have better options here
    throw new Cancelled("could not find uninstaller");
  }

  await getBlessing(opts, "uninstall");

  // FIXME: find the one true uninstaller instead of running them all
  for (const unins of uninstallers) {
    logger.info(`running nsis uninstaller ${unins}`);
    const code = await spawn({
      command: "elevate.exe",
      args: [
        unins,
        "/S", // run the uninstaller silently
        `_?=${destPath}`, // specify uninstallation path
      ],
      opts: { cwd: destPath },
      onToken: (tok: string) => logger.info(`${unins}: ${tok}`),
      ctx,
      logger,
    });
    logger.info(`elevate / nsis uninstaller exited with code ${code}`);

    if (code !== 0) {
      logger.error("uninstaller failed, cancelling uninstallation");
      throw new Cancelled();
    }
  }
}

const manager: IInstallManager = { install, uninstall };
export default manager;
