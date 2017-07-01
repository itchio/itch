import { Watcher } from "../watcher";
import * as actions from "../../actions";
import Context from "../../context";
import { Logger } from "../../logger";
import { IQueueCaveUninstallPayload } from "../../constants/action-types";
import { currentRuntime } from "../../os/runtime";

import * as paths from "../../os/paths";
import * as sf from "../../os/sf";

import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";
import { IUpload } from "../../types";

import { coreUninstall } from "../install-managers/core";

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

  try {
    const game = await lazyGetGame(ctx, cave.gameId);
    if (!game) {
      throw new Error("Couldn't find game to operate on");
    }

    const runtime = currentRuntime();
    const upload = fromJSONField<IUpload>(cave.upload);

    const prefs = ctx.store.getState().preferences;
    const destPath = paths.appPath(cave, prefs);
    const archivePath = paths.downloadPath(upload, prefs);

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
      upload,
      installLocation: cave.installLocation,
      handPicked: false,
    });

    logger.info(`Uninstall successful, imploding cave`);
    ctx.db.deleteEntity("caves", caveId);

    logger.info(`And wiping archive`);
    await sf.wipe(archivePath);
  } catch (e) {
    const response = await promisedModal(ctx.store, {
      title: ["preferences.advanced.clear_browsing_data"],
      message: `The uninstall failed. Remove the entry anyway?`,
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

    logger.info(`Uninstall unsuccessful, but imploding cave anyway`);
    ctx.db.deleteEntity("caves", caveId);
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
