
import * as ospath from "path";
import * as fs from "fs";
import {app} from "electron";

import logger from "../logger";

let configFile = ospath.join(app.getPath("userData"), "config.json");
let data: any = {};

try {
  data = JSON.parse(fs.readFileSync(configFile, {encoding: "utf8"}));
} catch (e) {
  // We don't want that to be fatal
  if (e.code === "ENOENT") {
    // that's ok
    logger.info("No config file, it's a fresh install!");
  } else {
    logger.warn(`Could not read config: ${e}`);
  }
}

const self = {
  save: function () {
    try {
      fs.writeFileSync(configFile, JSON.stringify(data), {encoding: "utf8"});
    } catch (err) {
      logger.warn(`Could not save config: ${err}`);
    }
  },

  get: function (key: string): any {
    return data[key];
  },

  set: function (key: string, value: any) {
    data[key] = value;
    self.save();
  },

  clear: function (key: string) {
    delete data[key];
    self.save();
  },
};

export default self;
