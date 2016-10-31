
import * as bluebird from "bluebird";
import * as path from "path";
import * as walk from "walk";

import { IConfigureResult, fixExecs } from"./common";

const self = {
  configure: async function (cavePath: string): Promise<IConfigureResult> {
    // TODO: this also sounds like a good candidate for a butler command.
    // golang is much better at working with files.
    const bundles: Array<string> = [];
    const walker = walk.walk(cavePath, {
      followLinks: false,
      filters: ["__MACOSX"],
    });

    walker.on("directory", (root, fileStats, next) => {
      if (/\.app$/i.test(fileStats.name)) {
        const fullPath = path.join(root, fileStats.name);
        const relPath = path.relative(cavePath, fullPath);
        bundles.push(relPath + "/");
      }
      next();
    });

    walker.on("errors", (root, nodeStatsArray, next) => {
      next();
    });

    await new bluebird((resolve, reject) => {
      walker.on("end", resolve);
    });

    if (bundles.length) {
      const fixer = (x: string) => fixExecs("macExecutable", path.join(cavePath, x));
      await bluebird.each(bundles, fixer);
      return { executables: bundles };
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    const executables = await fixExecs("macExecutable", cavePath);
    return { executables };
  },
};

export default self;
