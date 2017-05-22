
import {EventEmitter} from "events";

import sf from "../../os/sf";
import butler from "../../util/butler";
import * as invariant from "invariant";

import * as ospath from "path";

import {IStartTaskOpts} from "../../types";

const self = {
  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const {archivePath, destPath, logger} = opts;
    invariant(archivePath, "naked has archivePath");
    invariant(destPath, "naked has destPath");

    await sf.mkdir(destPath);

    const destFilePath = ospath.join(destPath, ospath.basename(archivePath));
    logger.info(`copying ${archivePath} to ${destFilePath}`);

    await butler.ditto(archivePath, destFilePath, {
      ...opts,
      emitter: out,
    });
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const {destPath, logger} = opts;

    logger.info(`nuking ${destPath}`);
    await butler.wipe(destPath, {
      ...opts,
      emitter: out,
    });
  },
};

export default self;
