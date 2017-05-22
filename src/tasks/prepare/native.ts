
import handleWindowsPrereqs from "./windows-prereqs";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "prepare/native"});

import {EventEmitter} from "events";
import {ILaunchOpts} from "../../types";

export default async function prepare (out: EventEmitter, opts: ILaunchOpts): Promise<void> {
  const {store, manifest, cave} = opts;

  if (process.platform === "win32") {
    logger.info(`launching windows-prereqs`);
    try {
      await handleWindowsPrereqs({
        store,
        manifest,
        caveId: cave.id,
        logger: opts.logger,
        emitter: out,
      });
    } catch (e) {
      logger.error(`Windows prereqs full stack: ${e.stack}`);
      throw e;
    }
  } else {
    logger.info(`not on windows, nothing to do`);
  }
}
