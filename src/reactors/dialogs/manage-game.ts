import { Watcher } from "../watcher";
import { actions } from "../../actions";
import { DB } from "../../db/db";
import { messages } from "node-buse";
import getGameCredentials from "../../reactors/downloads/get-game-credentials";
import Context from "../../context/index";
import { buseGameCredentials, makeButlerInstance } from "../../util/buse-utils";

import rootLogger from "../../logger";
import { modalWidgets } from "../../components/modal-widgets/index";
const logger = rootLogger.child({ name: "manage-game" });

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.manageGame, async (store, action) => {
    const { game } = action.payload;

    const caves = db.caves.all(k => k.where("gameId = ?", game.id));

    const widgetParams = {
      game,
      caves,
      allUploads: [],
      loadingUploads: true,
    };

    const openModal = actions.openModal(
      modalWidgets.manageGame.make({
        title: ["prompt.manage_game.title", { title: game.title }],
        message: "",
        buttons: [
          {
            label: ["prompt.action.close"],
            className: "secondary",
          },
        ],
        widgetParams,
      })
    );
    store.dispatch(openModal);
    const modalId = openModal.payload.id;

    const ctx = new Context(store, db);

    const credentials = getGameCredentials(ctx, game);
    if (!credentials) {
      throw new Error(`no game credentials, can't download`);
    }

    try {
      const instance = await makeButlerInstance();
      instance.onClient(async client => {
        try {
          const res = await client.call(
            messages.GameFindUploads({
              game,
              credentials: buseGameCredentials(credentials),
            })
          );
          widgetParams.allUploads = res.uploads;
        } catch (e) {
          console.log(`Could not fetch compatible uploads: ${e.stack}`);
        } finally {
          instance.cancel();
        }
      });
      await instance.promise();
    } catch (e) {
      logger.warn(`could not list uploads: ${e.message}`);
    } finally {
      widgetParams.loadingUploads = false;

      store.dispatch(
        actions.updateModalWidgetParams(
          modalWidgets.manageGame.update({
            id: modalId,
            widgetParams,
          })
        )
      );
    }
  });
}
