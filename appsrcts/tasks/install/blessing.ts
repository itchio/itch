
import mklog from "../../util/log";
const log = mklog("blessing");

import {EventEmitter} from "events";

import {IStartTaskOpts} from "../../types/db";

const self = (out: EventEmitter, opts: IStartTaskOpts) => {
  log(opts, "blessing: stub, assuming yes");
  return Promise.resolve();
};

export default self;
