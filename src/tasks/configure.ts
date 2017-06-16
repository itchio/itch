
import db from "../db";

import * as os from "../os";
import butler from "../util/butler";

import * as paths from "../os/paths";
import {Logger} from "../logger";

import Game from "../db/models/game";
import Cave from "../db/models/cave";

import {EventEmitter} from "events";

import store from "../store/metal-store";

export interface IConfigureOpts {
  logger: Logger;
  cave: Cave;
  game: Game;
}

export interface IConfigureResult {
  executables: string[];
}

export default async function configure(out: EventEmitter, opts: IConfigureOpts, logger: Logger) {
  const {cave} = opts;

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

  await db.saveOne("caves", cave.id, {
    installedSize: verdict.totalSize,
    verdict: verdict,
  } as any);
}
