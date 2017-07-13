import * as os from "../../os";
import spawn from "../../os/spawn";
import * as sf from "../../os/sf";
import * as shortcut from "../../os/win32/shortcut";

import { app } from "electron";
import { join, dirname } from "path";

import rootLogger, { devNull } from "../../logger";
const logger = rootLogger.child({ name: "visual-elements" });

import Context from "../../context";

const getStartMenuVbs = `set sh = WScript.CreateObject("Wscript.Shell")
startPath = sh.SpecialFolders("StartMenu")
WScript.echo startPath`;

const visualElementsManifest = `<Application xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <VisualElements
    BackgroundColor="#2E2B2C"
    ShowNameOnSquare150x150Logo="on"
    ForegroundText="light"/>
</Application>`;

export async function createIfNeeded(ctx: Context): Promise<void> {
  if (os.platform() !== "win32") {
    return;
  }

  logger.debug(`Checking for Squirrel at ${shortcut.updateExePath}`);
  try {
    const updateStats = await sf.stat(shortcut.updateExePath);
    if (!updateStats.isFile()) {
      throw new Error("Update.exe is not a regular file");
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      logger.debug(`Skipping visual elements, squirrel not found`);
    } else {
      logger.warn("Couldn't find squirrel", e.stack);
    }
    return;
  }

  const updateDirName = dirname(shortcut.updateExePath);
  const manifestPath = join(updateDirName, "itch.VisualElementsManifest.xml");

  logger.info(`Writing visual elements manifest at ${manifestPath}`);
  await sf.writeFile(manifestPath, visualElementsManifest, {
    encoding: "utf8",
  });

  logger.debug(`Looking for start menu folder`);

  // avert your gaze for a minute...
  const vbsTempPath = join(app.getPath("temp"), "getstart.vbs");
  await sf.writeFile(vbsTempPath, getStartMenuVbs, { encoding: "utf8" });

  const out = await spawn.getOutput({
    command: "cscript",
    args: ["/nologo", vbsTempPath],
    ctx,
    logger: devNull,
  });
  const startMenuPath = out.trim();
  logger.debug(`Start menu path: ${out}`);

  // ...in fact, maybe don't read this file at all?
  const startStats = await sf.stat(out);
  if (!startStats.isDirectory()) {
    logger.warn(`Start menu is not a directory, giving up`);
    return;
  }

  const itchLinks = await sf.glob(`${app.getName()}.lnk`, {
    cwd: startMenuPath,
  });
  logger.debug(`Found shortcuts:\n${JSON.stringify(itchLinks, null, 2)}`);

  const mtime = Date.now() / 1000;
  for (const link of itchLinks) {
    const fullPath = join(startMenuPath, link);
    logger.info(`Touching ${fullPath}`);
    await sf.utimes(fullPath, mtime, mtime);
  }
}
