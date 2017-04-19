
import handleWindowsPrereqs from "./windows-prereqs";

import mklog from "../../util/log";
const log = mklog("prepare/native");

import {EventEmitter} from "events";
import {ILaunchOpts} from "../../types";

export default async function prepare (out: EventEmitter, opts: ILaunchOpts): Promise<void> {
  const {store, manifest, cave} = opts;

  if (process.platform === "win32") {
    try {
      await handleWindowsPrereqs({
        store,
        manifest,
        caveId: cave.id,
        globalMarket: opts.globalMarket,
        logger: opts.logger,
        emitter: out,
      });
    } catch (e) {
      log(opts, `Windows prereqs full stack: ${e.stack}`);
      throw e;
    }
  }
}
