
import os from "../../util/os";
import spawn from "../../util/spawn";
import mklog from "../../util/log";
import sf from "../../util/sf";
import shortcut from "../../util/shortcut";
import {join, dirname} from "path";
const log = mklog("visual-elements");

const getStartMenuVbs = `set sh = WScript.CreateObject("Wscript.Shell")
startPath = sh.SpecialFolders("StartMenu")
WScript.echo startPath`;

const visualElementsManifest = `<Application xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <VisualElements
    BackgroundColor="#2E2B2C"
    ShowNameOnSquare150x150Logo="on"
    ForegroundText="light"/>
</Application>`;

const self = {
  async createIfNeeded (opts: any): Promise<void> {
    if (os.platform() !== "win32") {
      return;
    }

    log(opts, `Checking for Squirrel at ${shortcut.updateExePath}`);
    try {
      const updateStats = await sf.stat(shortcut.updateExePath);
      if (!updateStats.isFile()) {
        throw new Error("Update.exe is not a regular file");
      }
    } catch (e) {
      log(opts, `While checking for squirrel: ${e} - skipping`);
      return;
    }

    const updateDirName = dirname(shortcut.updateExePath);
    const manifestPath = join(updateDirName, "itch.VisualElementsManifest.xml");

    log(opts, `Writing visual elements manifest at ${manifestPath}`);
    await sf.writeFile(manifestPath, visualElementsManifest, {encoding: "utf8"});

    log(opts, `Looking for start menu folder`);

    // avert your gaze for a minute...
    const vbsTempPath = join(app.getPath("temp"), "getstart.vbs");
    await sf.writeFile(vbsTempPath, getStartMenuVbs, {encoding: "utf8"});

    const out = await spawn.getOutput({
      command: "cscript",
      args: ["/nologo", vbsTempPath],
    });
    const startMenuPath = out.trim();
    log(opts, `Start menu path: ${out}`);

    // ...in fact, maybe don't read this file at all?
    const startStats = await sf.stat(out);
    if (!startStats.isDirectory()) {
      log(opts, `Start menu is not a directory, giving up`);
      return;
    }

    const itchLinks = await sf.glob(`${app.getName()}.lnk`, {cwd: startMenuPath});
    log(opts, `Found shortcuts:\n${JSON.stringify(itchLinks, null, 2)}`);

    const mtime = Date.now() / 1000;
    for (const link of itchLinks) {
      const fullPath = join(startMenuPath, link);
      log(opts, `Touching ${fullPath}`);
      await sf.utimes(fullPath, mtime, mtime);
    }

    log(opts, `VisualElementsManifest successfully installed/updated!`);
  },
};

export default self;
