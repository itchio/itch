
import * as ospath from "path";
import * as mkdirp from "mkdirp";

import env from "../env";
const full = (process.type !== "renderer" && env.name !== "test");

import pathmaker from "../util/pathmaker";
import mklog from "../util/log";

import {app} from "electron";

// naughty
try {
  mkdirp.sync(ospath.dirname(pathmaker.logPath()));
} catch (e) {
  if (e.code !== "EEXIST") {
    console.log(`While creating logs dir: ${e.stack}`); // tslint:disable-line:no-console
  }
}

const loggerOpts = {
  sinks: {
    file: null as string,
  },
};
if (full) {
  loggerOpts.sinks.file = pathmaker.logPath();
}

export const logger = new mklog.Logger(loggerOpts);
export default logger;

const log = mklog("itch");
export const opts = {logger};

if (full) {
  log(opts, `itch ${app.getVersion()} on electron ${process.versions.electron}`);
  log(opts, `user data path: ${app.getPath("userData")}`);
}
