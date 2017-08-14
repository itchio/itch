import { Watcher } from "../watcher";
import * as actions from "../../actions";
import Context from "../../context";
import { Logger } from "../../logger";
import { IQueueCaveUninstallPayload } from "../../constants/action-types";
import { currentRuntime } from "../../os/runtime";

import * as paths from "../../os/paths";

import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";
import { IUpload, Cancelled } from "../../types";

import { coreUninstall } from "../../install-managers/common/core";

import butler from "../../util/butler";

import { MODAL_RESPONSE } from "../../constants/action-types";
import { promisedModal } from "../modals";

import asTask from "./as-task";
import lazyGetGame from "../lazy-get-game";

export async function queueUninstall(
  ctx: Context,
  logger: Logger,
  opts: IQueueCaveUninstallPayload,
) {
  const { caveId } = opts;

  const cave = ctx.db.caves.findOneById(caveId);
  if (!cave) {
    throw new Error("Couldn't find cave to operate on");
  }

  let doCleanup = false;
  const runtime = currentRuntime();
  const upload = fromJSONField<IUpload>(cave.upload);

  const prefs = ctx.store.getState().preferences;
  const destPath = paths.appPath(cave, prefs);
  const archivePath = paths.downloadPath(upload, prefs);

  try {
    const game = await lazyGetGame(ctx, cave.gameId);
    if (!game) {
      throw new Error("Couldn't find game to operate on");
    }

    await coreUninstall({
      ctx,
      runtime,
      logger,
      destPath,
      archivePath,
      game,
      cave,
      upload,
    });

    logger.info(`Uninstall successful`);
    doCleanup = true;
  } catch (e) {
    if (e instanceof Cancelled) {
      logger.info(`Uninstall cancelled`);
      return;
    }

    logger.error(`Uninstall failed: ${e.stack}`);

    const response = await promisedModal(ctx.store, {
      title: ["prompt.uninstall_error.title"],
      message: ["prompt.uninstall_error.message"],
      buttons: [
        {
          label: ["prompt.action.ok"],
          action: actions.modalResponse({}),
        },
        "cancel",
      ],
    });

    if (response.type !== MODAL_RESPONSE) {
      // modal was closed
      return;
    }

    logger.info(`User asked for listing to be removed anyway`);
    doCleanup = true;
  }

  if (doCleanup) {
    logger.info(`Imploding cave...`);
    ctx.db.deleteEntity("caves", caveId);

    logger.info(`Wiping archive...`);
    await butler.wipe(archivePath, { ctx, logger });

    logger.info(`Wiping install folder...`);
    await butler.wipe(destPath, { ctx, logger });
  }
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      // no such cave, can't uninstall!
      return;
    }

    const game = db.games.findOneById(cave.gameId);

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
