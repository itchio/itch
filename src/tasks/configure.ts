
import * as invariant from "invariant";

import * as os from "../os";
import butler from "../util/butler";

import * as paths from "../os/paths";
import {Logger} from "../logger";
import {ICaveRecord, IGameRecord, IUploadRecord} from "../types";

import {EventEmitter} from "events";

import store from "../store/metal-store";

export interface IConfigureOpts {
  logger: Logger;
  cave: ICaveRecord;
  game: IGameRecord;
  upload: IUploadRecord;
}

export interface IConfigureResult {
  executables: string[];
}

export default async function configure(out: EventEmitter, inOpts: IConfigureOpts) {
  const {cave, upload, game} = inOpts;
  // FIXME: db
  const globalMarket: any = null;
  invariant(cave, "configure has cave");
  invariant(game, "configure has game");
  invariant(upload, "configure has upload");

  const logger = paths.caveLogger(cave.id);

  const opts = {
    ...inOpts,
    logger,
  };

  const appPath = paths.appPath(cave, store.getState().preferences);
  logger.info(`configuring ${appPath}`);

  let osFilter;
  let archFilter;

  switch (process.platform) {
    case "linux":
      osFilter = "linux";
      if (os.isLinux64()) {
        archFilter = "amd64";
      } else {
        archFilter = "386";
      }
      break;
    case "darwin":
      osFilter = "darwin";
      archFilter = "amd64";
      break;
    case "win32":
      osFilter = "windows";
      if (os.isWin64()) {
        archFilter = "amd64";
      } else {
        archFilter = "386";
      }
      break;
    default: 
      logger.warn(`unrecognized platform, assuming linux-amd64`);
      osFilter = "linux";
      archFilter = "amd64";
  }

  const verdict = await butler.configure({
    path: appPath,
    osFilter,
    archFilter,
    logger,
    emitter: out,
  });
  logger.info(`verdict =\n${JSON.stringify(verdict, null, 2)}`);

  globalMarket.saveEntity("caves", cave.id, {
    installedSize: verdict.totalSize,
    verdict: verdict,
  } as any);
}
