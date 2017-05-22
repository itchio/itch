
import {EventEmitter} from "events";

import spawn from "../../os/spawn";
import sf from "../../os/sf";

import blessing from "./blessing";

import * as ospath from "path";

import {IStartTaskOpts} from "../../types";

// Adobe Air docs: http://help.adobe.com/en_US/air/redist/WS485a42d56cd19641-70d979a8124ef20a34b-8000.html

let MANIFEST_GLOB = "**/META-INF/AIR/application.xml";
let ID_RE = /<id>(.*)<\/id>/;

interface ICodeMessages {
  [key: number]: string;
}

let CODE_MESSAGES = {
  1: "Successful, but restart required for completion",
  2: "Usage error (incorrect arguments)",
  3: "Runtime not found",
  4: "Loading runtime failed",
  5: "Unknown error",
  6: "Installation canceled",
  7: "Installation failed",
  8: "Installation failed; update already in progress",
  9: "Installation failed; application already installed",
} as ICodeMessages;

let self = {
  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    // FIXME: db
    const globalMarket: any = null;
    const logger = opts.logger.child("install/air");

    await blessing(out, opts);
    out.emit("progress", {progress: -1});

    let archivePath = opts.archivePath;
    let destPath = opts.destPath;

    let spawnOpts = {
      command: "elevate.exe",
      args: [
        archivePath, // the installer
        "-silent", // run the installer silently
        "-eulaAccepted", // let AIR install if it so wishes
        "-location", destPath, // install where we want to
      ],
      onToken: (token: string) => logger.info(token),
    };
    let code = await spawn(spawnOpts);
    logger.info(`air installer exited with code ${code}`);

    if (code !== 0) {
      let message = CODE_MESSAGES[code];
      throw new Error(`AIR installer error: ${message}`);
    }

    logger.info("Locating app manifest");

    let candidates = await sf.glob(MANIFEST_GLOB, {cwd: destPath});
    if (candidates.length === 0) {
      throw new Error("Adobe AIR app manifest not found, cannot uninstall");
    }

    logger.info(`Found app manifest at ${candidates[0]}`);

    let manifestPath = ospath.join(destPath, candidates[0]);
    let manifestContents = await sf.readFile(manifestPath, {encoding: "utf8"});
    let matches = ID_RE.exec(manifestContents);
    if (!matches) {
      throw new Error(`Could not extract app id from manifest at ${manifestPath}`);
    }

    let appid = matches[1];
    logger.info(`Found appid ${appid}, remembering`);
    globalMarket.saveEntity("caves", opts.cave.id, {airAppid: appid});
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const {globalMarket} = opts;
    const logger = opts.logger.child("uninstall/air");

    out.emit("progress", {progress: -1});

    logger.info("Grabbing adobe\'s Air Runtime Helper if needed...");

    const ibrew = require("../../util/ibrew").default;
    let ibrewOpts = {
      logger,
      onStatus: (msg: string) => logger.info(`ibrew status: ${msg}`),
    };
    await ibrew.fetch(ibrewOpts, "arh");

    let cave = opts.cave;
    let appid = cave.airAppid;
    if (!appid) {
      logger.info("No appid, skipping arh uninstall");
      return;
    }

    logger.info(`Uninstalling appid ${appid}`);

    let spawnOpts = {
      command: "elevate.exe",
      args: [
        "arh.exe",
        "-uninstallAppSilent",
        appid,
      ],
      onToken: (tok: string) => logger.info(`arh: ${tok}`),
    };
    let code = await spawn(spawnOpts);
    if (code !== 0) {
      throw new Error(`arh uninstall failed with code ${code}`);
    }
    globalMarket.saveEntity("caves", cave.id, {airAppid: null});

    logger.info("Uninstallation successful");
  },
};

export default self;
