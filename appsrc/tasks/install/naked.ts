
import {EventEmitter} from "events";

import sf from "../../util/sf";
import butler from "../../util/butler";
import * as invariant from "invariant";

import * as ospath from "path";

import mklog from "../../util/log";
const log = mklog("install/naked");

import {IStartTaskOpts} from "../../types";

const self = {
  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const {archivePath, destPath} = opts;
    invariant(archivePath, "naked has archivePath");
    invariant(destPath, "naked has destPath");

    await sf.mkdir(destPath);

    const destFilePath = ospath.join(destPath, ospath.basename(archivePath));
    log(opts, `copying ${archivePath} to ${destFilePath}`);

    await butler.ditto(archivePath, destFilePath, {
      ...opts,
      emitter: out,
    });
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    const {destPath} = opts;

    log(opts, `nuking ${destPath}`);
    await butler.wipe(destPath, {
      ...opts,
      emitter: out,
    });
  },
};

export default self;
