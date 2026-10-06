import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";
import { getErrorStack } from "common/butlerd/errors";
import { TypedModal } from "common/modals";
import {
  GameCollectionsParams,
  GameCollectionsResponse,
} from "common/modals/types";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  let pendingCollectionsRequest: { gameId: number } | null = null;

  watcher.on(actions.openGameCollectionsDialog, async (store, action) => {
    const { gameId } = action.payload;
    if (pendingCollectionsRequest?.gameId === gameId) {
      return;
    }

    // A new request supersedes any fetch already in flight, including when
    // the user returns to the game whose dialog is still open.
    pendingCollectionsRequest = null;
    const collectionsDialogs = () =>
      (store.getState().winds.root?.modals ?? []).filter(
        (
          modal
        ): modal is TypedModal<
          GameCollectionsParams,
          GameCollectionsResponse
        > => modal.widget === modals.gameCollections.key
      );
    if (
      collectionsDialogs().some(
        (modal) => modal.unclosable || modal.widgetParams.game.id === gameId
      )
    ) {
      return;
    }

    const request = { gameId };
    pendingCollectionsRequest = request;
    let game: messages.Game | undefined;
    try {
      const result = await mcall(messages.FetchGame, { gameId });
      if (pendingCollectionsRequest !== request) {
        return;
      }
      game = result.game;
    } catch (e) {
      logger.warn(`Could not fetch game ${gameId}: ${getErrorStack(e)}`);
      return;
    } finally {
      if (pendingCollectionsRequest === request) {
        pendingCollectionsRequest = null;
      }
    }
    if (!game) {
      logger.warn(`Could not fetch game ${gameId}, not opening collections`);
      return;
    }

    const existing = collectionsDialogs();
    // Saving may have started while FetchGame was pending.
    if (existing.some((modal) => modal.unclosable)) {
      return;
    }
    for (const modal of existing) {
      store.dispatch(
        actions.modalClosed({ wind: "root", id: modal.id, response: null })
      );
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
