
import nconf from "nconf";
import path from "path";
import app from "app";

let config_file = path.join(app.getPath("userData"), "config.json");
nconf.file({file: config_file});

export function save() {
  nconf.save((err) => {
    if (err) {
      console.log(`Could not save config: ${err}`);
    }
  });
}

export function get(key) {
  return nconf.get(key);
}

export function set(key, value) {
  nconf.set(key, value);
  save();
}

export function clear(key) {
  nconf.clear(key);
  save();
}

