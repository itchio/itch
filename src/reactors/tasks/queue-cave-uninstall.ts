import { Watcher } from "../watcher";
import * as actions from "../../actions";
import Context from "../../context";
import rootLogger, { Logger } from "../../logger";
import { currentRuntime } from "../../os/runtime";

import * as paths from "../../os/paths";

import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";
import { IUpload } from "../../types";

import { coreUninstall } from "../../install-managers/common/core";

import butler from "../../util/butler";

import { MODAL_RESPONSE } from "../../constants/action-types";
import { promisedModal } from "../modals";

import asTask from "./as-task";
import lazyGetGame from "../lazy-get-game";
import { ICave } from "../../db/models/cave";

export async function queueUninstall(
  ctx: Context,
  logger: Logger,
  { cave, destPath, upload }: { cave: ICave; destPath: string; upload: IUpload }
) {
  const runtime = currentRuntime();

  const game = await lazyGetGame(ctx, cave.gameId);
  if (!game) {
    throw new Error("Couldn't find game to operate on");
  }

  await coreUninstall({
    ctx,
    runtime,
    logger,
    destPath,
    game,
    cave,
    upload,
  });

  logger.info(`Uninstall successful`);
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
        })
      );
      return;
    }

    const prefs = store.getState().preferences;
    const upload = fromJSONField(cave.upload);
    const destPath = paths.appPath(cave, prefs);

    let doCleanup = false;

    await asTask({
      name: "uninstall",
      gameId: game.id,
      db,
      store,
      work: async (ctx, logger) => {
        await queueUninstall(ctx, logger, {
          cave,
          destPath,
          upload,
        });
        store.dispatch(actions.clearGameDownloads({ gameId: cave.gameId }));
        doCleanup = true;
      },
      onError: async (err, log) => {
        const response = await promisedModal(store, {
          title: ["prompt.uninstall_error.title"],
          message: ["prompt.uninstall_error.message"],
          widget: "show-error",
          widgetParams: {
            errorStack: err.stack,
            log,
          },
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
        doCleanup = true;
      },
    });

    if (doCleanup) {
      const logger = rootLogger;
      const ctx = new Context(store, db);

      logger.info(`Imploding cave...`);
      db.deleteEntity("caves", cave.id);

      logger.info(`Wiping install folder...`);
      try {
        await butler.wipe(destPath, { ctx, logger });
      } catch (e) {
        const onWindows = currentRuntime().platform === "windows";
        const shouldSuggestAdminWipe = onWindows && /Access is denied/.test(e);

        if (shouldSuggestAdminWipe) {
          const response = await promisedModal(store, {
            title: ["prompt.uninstall_error.title"],
            message: [
              "prompt.uninstall_error.message_permissions",
              { title: game.title },
            ],
            buttons: [
              {
                label: ["prompt.uninstall_error.action_permissions"],
                action: actions.modalResponse({}),
              },
              "cancel",
            ],
          });
          if (response.type !== MODAL_RESPONSE) {
            // modal was closed
            return;
          }

          await butler.wipe(destPath, { ctx, logger, elevate: true });
          logger.info(`Admin wipe succeeded!`);
        } else {
          throw e;
        }
      }
    }
  });
}
