
// tslint:disable:no-console

import * as fs from "fs";
import * as ospath from "path";
import * as glob from "glob";

require("source-map-support").install();
require("bluebird").config({
  longStackTraces: true,
});

const env = require("../env");
env.name = "test";
process.env.NODE_ENV = "test";

const isDir = (f: string) => {
  try {
    return fs.lstatSync(f).isDirectory();
  } catch (e) {
    // probably a glob
  }
  return false;
};

const args = process.argv.slice(2);
if (args.length === 0) {
  args.push(ospath.resolve(__dirname));
}

for (let arg of args) {
  if (isDir(arg)) {
    console.log(`Running all specs in ${arg}`);
    arg = `${arg}/**/*-spec.js`;
  }

  glob(arg, function (e, files) {
    files.forEach(function (file) {
      const test = ospath.resolve(process.cwd(), file);
      require(test);
    });
  });
}
