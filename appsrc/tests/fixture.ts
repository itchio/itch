
import * as fs from "fs";
import * as ospath from "path";

const fixturesPath = ospath.resolve(`${__dirname}/../fixtures`);

let self = {
  path: function (spec: string) {
    return ospath.join(fixturesPath, `files/${spec}`);
  },

  lines: function (spec: string, file: string): string[] {
    return fs.readFileSync(ospath.join(fixturesPath, `files/${spec}/${file}.txt`), {encoding: "utf8"}).split("\n");
  },

  json: function (spec: string): any {
    const path = ospath.join(fixturesPath, `${spec}.json`);
    return JSON.parse(fs.readFileSync(path, {encoding: "utf8"}));
  },

  api: function (spec: string) {
    return self.json(`api/${spec}`);
  },
};

export default self;
