import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";
import { getErrorStack } from "common/butlerd/errors";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.openGameCollectionsDialog, async (store, action) => {
    const { gameId } = action.payload;
    const { game } = await mcall(messages.FetchGame, { gameId });
    if (!game) {
      logger.warn(`Could not fetch game ${gameId}, not opening collections`);
      return;
    }

    store.dispatch(
      actions.openModal(
        modals.gameCollections.make({
          wind: "root",
          title: ["collection.dialog.title"],
          message: "",
          widgetParams: { game },
        })
      )
    );
  });

  watcher.on(actions.requestCollectionDelete, async (store, action) => {
    const { collectionId, tab } = action.payload;
    const profileId = store.getState().profile.profile?.id;
    if (!profileId) {
      return;
    }
    const { collection } = await mcall(messages.FetchCollection, {
      profileId,
      collectionId,
    });
    if (!collection) {
      return;
    }

    store.dispatch(
      actions.openModal(
        modals.confirmDeleteCollection.make({
          wind: "root",
          title: ["prompt.delete_collection.title"],
          message: "",
          widgetParams: { collection, tab },
        })
      )
    );
  });

  watcher.on(actions.deleteCollection, async (store, action) => {
    const { collectionId, tab } = action.payload;
    const profileId = store.getState().profile.profile?.id;
    if (!profileId) {
      return;
    }

    try {
      await mcall(messages.CollectionsDelete, { profileId, collectionId });
    } catch (e) {
      store.dispatch(
        actions.openModal(
          modals.showError.make({
            wind: "root",
            title: ["prompt.delete_collection.title"],
            message: getErrorStack(e),
            widgetParams: { rawError: e, log: "" },
          })
        )
      );
      return;
    }

    store.dispatch(actions.collectionsChanged({}));
    if (tab) {
      store.dispatch(
        actions.evolveTab({
          wind: "root",
          tab,
          url: "itch://collections",
          replace: true,
        })
      );
    }
  });
}
