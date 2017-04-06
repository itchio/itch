
import * as nconf from "nconf";
import * as ospath from "path";
import {app} from "electron";

let configFile = ospath.join(app.getPath("userData"), "config.json");
try {
  nconf.file({file: configFile});
} catch (e) {
  // We don't want that to be fatal
  console.log(`Could not read config: ${e}`); // tslint:disable-line:no-console
}

let self = {
  save: function () {
    nconf.save((err: Error) => {
      if (err) {
        console.log(`Could not save config: ${err}`); // tslint:disable-line:no-console
      }
    });
  },

  get: function (key: string): any {
    return nconf.get(key);
  },

  set: function (key: string, value: any) {
    nconf.set(key, value);
    self.save();
  },

  clear: function (key: string) {
    nconf.clear(key);
    self.save();
  },
};

export default self;
