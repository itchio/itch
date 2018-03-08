import { Watcher } from "../watcher";
import { actions } from "../../actions";
import { DB } from "../../db/db";

import rootLogger from "../../logger";
import { modalWidgets } from "../../components/modal-widgets/index";
import {
  makeButlerInstance,
  messages,
  withButlerClient,
} from "../../buse/index";
const logger = rootLogger.child({ name: "manage-game" });

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.manageGame, async (store, action) => {
    const { game } = action.payload;

    const { caves } = await withButlerClient(
      logger,
      async client =>
        await client.call(messages.FetchCavesByGameID({ gameId: game.id }))
    );

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

    try {
      const instance = await makeButlerInstance();
      instance.onClient(async client => {
        try {
          const { uploads } = await client.call(
            messages.GameFindUploads({ game })
          );
          widgetParams.allUploads = uploads;
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
