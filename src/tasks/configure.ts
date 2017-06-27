import * as os from "../os";
import butler from "../util/butler";

import * as paths from "../os/paths";
import { Logger } from "../logger";

import Game from "../db/models/game";
import Cave from "../db/models/cave";

import Context from "../context";

export interface IConfigureOpts {
  ctx: Context;
  logger: Logger;
  cave: Cave;
  game: Game;
}

export interface IConfigureResult {
  executables: string[];
}

export default async function configure(opts: IConfigureOpts) {
  const { ctx, cave, logger } = opts;

  const appPath = paths.appPath(cave, ctx.store.getState().preferences);
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
    ctx,
    path: appPath,
    osFilter,
    archFilter,
    logger,
  });
  logger.info(`verdict =\n${JSON.stringify(verdict, null, 2)}`);

  await ctx.db.saveOne(
    "caves",
    cave.id,
    {
      installedSize: verdict.totalSize,
      verdict: verdict,
    } as any,
  );
}
