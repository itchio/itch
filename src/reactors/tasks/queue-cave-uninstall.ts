import { Watcher } from "../watcher";
import * as actions from "../../actions";
import Context from "../../context";
import { Logger } from "../../logger";
import { IQueueCaveUninstallPayload } from "../../constants/action-types";
import { currentRuntime } from "../../os/runtime";

import * as paths from "../../os/paths";

import { DB } from "../../db";
import { coreUninstall } from "../install-managers/core";

import asTask from "./as-task";
import lazyGetGame from "../lazy-get-game";

export async function queueUninstall(
  ctx: Context,
  logger: Logger,
  opts: IQueueCaveUninstallPayload,
) {
  const { caveId } = opts;

  const cave = await ctx.db.caves.findOneById(caveId);
  if (!cave) {
    throw new Error("Couldn't find cave to operate on");
  }

  const game = await lazyGetGame(ctx, cave.gameId);
  if (!game) {
    throw new Error("Couldn't find game to operate on");
  }

  const runtime = currentRuntime();

  const prefs = ctx.store.getState().preferences;
  const destPath = paths.appPath(cave, prefs);
  const archivePath = paths.downloadPath(cave.upload, prefs);

  // FIXME: so I think everyone agrees that coreInstall and coreUninstall
  // should have some shared props but uhhh we shouldn't need to specify all
  // of those, that just makes no sense.
  await coreUninstall({
    reason: "install", // FIXME: wtf
    ctx,
    runtime,
    logger,
    destPath,
    archivePath,
    game,
    caveId,
    upload: cave.upload,
    installLocation: cave.installLocation,
    handPicked: false,
  });

  logger.info(`Uninstall successful, imploding cave`);
  await ctx.db.deleteEntity("caves", caveId);
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    const cave = await db.caves.findOneById(caveId);
    if (!cave) {
      // no such cave, can't uninstall!
      return;
    }

    const game = await db.games.findOneById(cave.gameId);

    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(
        actions.statusMessage({
          message: [
            "status.uninstall.busy",
            { title: game ? game.title : "<?>" },
          ],
        }),
      );
      return;
    }

    await asTask({
      name: "uninstall",
      gameId: game.id,
      caveId,
      db,
      store,
      work: (ctx, logger) => queueUninstall(ctx, logger, action.payload),
    });

    store.dispatch(actions.clearGameDownloads({ gameId: cave.gameId }));
  });
}
