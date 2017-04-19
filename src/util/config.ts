
import * as ospath from "path";
import * as fs from "fs";
import {app} from "electron";

let configFile = ospath.join(app.getPath("userData"), "config.json");
let data: any = {};

try {
  data = JSON.parse(fs.readFileSync(configFile, {encoding: "utf8"}));
} catch (e) {
  // We don't want that to be fatal
  console.log(`Could not read config: ${e}`); // tslint:disable-line:no-console
}

let self = {
  save: function () {
    try {
      fs.writeFileSync(configFile, JSON.stringify(data), {encoding: "utf8"});
    } catch (err) {
      console.log(`Could not save config: ${err}`); // tslint:disable-line:no-console
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
