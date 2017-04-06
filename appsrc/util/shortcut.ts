
import * as ospath from "path";

import {app} from "electron";
import spawn from "./spawn";
import sf from "./sf";

import mklog from "./log";
const log = mklog("shortcut");
const opts = {logger: new mklog.Logger()};

const appFolder = ospath.resolve(process.execPath, "..");
const rootFolder = ospath.resolve(appFolder, "..");
const updateExePath = ospath.join(rootFolder, "Update.exe");
const exeName = ospath.basename(process.execPath);

const self = {
  updateRun: async function (args: string[]): Promise<void> {
    log(opts, `Update.exe located at = ${updateExePath}`);
    try {
      await spawn.assert({
        command: updateExePath,
        args,
      });
    } catch (err) {
      log(opts, `Running Update failed with ${err.message}`);
    }
  },

  createOrUpdateShortcut: async function (): Promise<void> {
    await self.updateRun(["--createShortcut", exeName]);
  },

  update: async function (): Promise<void> {
    const desktopPath = app.getPath("desktop");
    const shortcutPath = ospath.join(desktopPath, "itch.lnk");

    // find out if the user has deleted the desktop shortcut
    // cf. https://github.com/itchio/itch/issues/239
    let removeDesktopShortcut = false;

    if (await sf.exists(shortcutPath)) {
      log(opts, `Shortcut at ${shortcutPath} still exists, letting Squirrel do its thing`);
    } else {
      // shortcut was deleted by user, remove it after Squirrel recreates it
      removeDesktopShortcut = true;
      log(opts, `Shortcut at ${shortcutPath} has been deleted, preparing to re-delete`);
    }

    try {
      log(opts, "Updating shortcut with squirrel");
      await self.createOrUpdateShortcut();
      if (removeDesktopShortcut) {
        log(opts, "Removing shortcut as requested");
        await sf.wipe(shortcutPath);
      }
    } catch (e) {
      log(opts, `Could not update shortcut: ${e.stack || e}`);
    }
  },

  install: async function (): Promise<void> {
    log(opts, "Creating shortcut with squirrel");
    try {
      await self.createOrUpdateShortcut();
    } catch (e) {
      log(opts, `Could not create shortcut: ${e.stack || e}`);
    }
  },

  uninstall: async function (): Promise<void> {
    log(opts, "Removing shortcut with squirrel");
    try {
      await self.updateRun(["--removeShortcut", exeName]);
    } catch (e) {
      log(opts, `Could not remove shortcut: ${e.stack || e}`);
    }
  },

};

export default self;
