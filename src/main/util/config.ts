import ospath from "path";
import fs from "fs";
import { app } from "electron";
import { writeFile } from "main/os/sf";

let configFile = ospath.join(app.getPath("userData"), "config.json");
let data: any = {};

try {
  data = JSON.parse(fs.readFileSync(configFile, { encoding: "utf8" }));
} catch (e) {
  // We don't want that to be fatal
  if (e.code === "ENOENT") {
    // that's ok
  } else {
    console.warn(`Could not read config: ${e}`);
  }
}

const self = {
  save: function () {
    const promise = writeFile(configFile, JSON.stringify(data), {
      encoding: "utf8",
    });
    promise.catch((err) => {
      console.warn(`Could not save config: ${err}`);
    });
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
