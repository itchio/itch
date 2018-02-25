import { actions } from "../actions";

import asTask from "./tasks/as-task";
import { Watcher } from "./watcher";

import { DB } from "../db";

import { currentRuntime } from "../os/runtime";

import lazyGetGame from "./lazy-get-game";

import { isAborted } from "../types";

import { promisedModal } from "./modals";
import { t } from "../format/t";
import { Game } from "node-buse/lib/messages";
import { modalWidgets } from "../components/modal-widgets/index";

import { performLaunch } from "./launch/perform-launch";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueLaunch, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      throw new Error("no such cave");
    }

    const runtime = currentRuntime();

    let game: Game;

    asTask({
      name: "launch",
      gameId: cave.gameId,
      store,
      db,
      work: async (ctx, logger) => {
        game = await lazyGetGame(ctx, cave.gameId);
        if (!game) {
          throw new Error("no such game");
        }

        return await performLaunch(ctx, logger, cave, game, runtime);
      },
      onError: async (e: any, log) => {
        if (isAborted(e)) {
          // just ignore it then
          return;
        }

        let title = game ? game.title : "<missing game>";
        const i18n = store.getState().i18n;

        let errorMessage = String(e);
        if (e.reason) {
          if (Array.isArray(e.reason)) {
            errorMessage = t(i18n, e.reason);
          } else {
            errorMessage = String(e.reason);
          }
        } else {
          // only show first line
          errorMessage = errorMessage.split("\n")[0];
        }

        await promisedModal(
          store,
          modalWidgets.showError.make({
            title: ["game.install.could_not_launch", { title }],
            message: [
              "game.install.could_not_launch.message",
              { title, errorMessage },
            ],
            detail: ["game.install.could_not_launch.detail"],
            widgetParams: {
              errorStack: e.stack,
              log,
            },
            buttons: [
              {
                label: ["prompt.action.ok"],
              },
              "cancel",
            ],
          })
        );
      },
    });
  });
}
