
import {resolve, join, basename} from "path";
import {app} from "electron";
import spawn from "../spawn";
import * as sf from "../sf";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "shortcut"});

const appFolder = resolve(process.execPath, "..");
const rootFolder = resolve(appFolder, "..");
const updateExePath = join(rootFolder, "Update.exe");
const exeName = basename(process.execPath);

const self = {
  updateRun: async function (args: string[]): Promise<void> {
    logger.info(`Update.exe located at = ${updateExePath}`);
    try {
      await spawn.assert({
        command: updateExePath,
        args,
      });
    } catch (err) {
      logger.error(`Running Update failed with ${err.message}`);
    }
  },

  createOrUpdateShortcut: async function (): Promise<void> {
    await self.updateRun(["--createShortcut", exeName]);
  },

  update: async function (): Promise<void> {
    const desktopPath = app.getPath("desktop");
    const shortcutPath = join(desktopPath, "itch.lnk");

    // find out if the user has deleted the desktop shortcut
    // cf. https://github.com/itchio/itch/issues/239
    let removeDesktopShortcut = false;

    if (await sf.exists(shortcutPath)) {
      logger.info(`Shortcut at ${shortcutPath} still exists, letting Squirrel do its thing`);
    } else {
      // shortcut was deleted by user, remove it after Squirrel recreates it
      removeDesktopShortcut = true;
      logger.info(`Shortcut at ${shortcutPath} has been deleted, preparing to re-delete`);
    }

    try {
      logger.info("Updating shortcut with squirrel");
      await self.createOrUpdateShortcut();
      if (removeDesktopShortcut) {
        logger.info("Removing shortcut as requested");
        await sf.wipe(shortcutPath);
      }
    } catch (e) {
      logger.error(`Could not update shortcut: ${e.stack || e}`);
    }
  },

  install: async function (): Promise<void> {
    logger.info("Creating shortcut with squirrel");
    try {
      await self.createOrUpdateShortcut();
    } catch (e) {
      logger.info(`Could not create shortcut: ${e.stack || e}`);
    }
  },

  uninstall: async function (): Promise<void> {
    logger.info("Removing shortcut with squirrel");
    try {
      await self.updateRun(["--removeShortcut", exeName]);
    } catch (e) {
      logger.info(`Could not remove shortcut: ${e.stack || e}`);
    }
  },

  updateExePath,
};

export default self;
