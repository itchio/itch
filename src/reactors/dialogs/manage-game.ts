import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
import { modalWidgets } from "../../components/modal-widgets/index";
import { messages, withLogger } from "../../buse/index";
const logger = rootLogger.child({ name: "manage-game" });
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.manageGame, async (store, action) => {
    const { game } = action.payload;

    const { caves } = await call(messages.FetchCavesByGameID, {
      gameId: game.id,
    });

    const widgetParams = {
      game,
      caves,
      allUploads: [],
      loadingUploads: true,
    };

    const openModal = actions.openModal(
      modalWidgets.manageGame.make({
        title: game.title,
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
      try {
        const { uploads } = await call(messages.GameFindUploads, { game });
        widgetParams.allUploads = uploads;
      } catch (e) {
        console.log(`Could not fetch compatible uploads: ${e.stack}`);
      }
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
