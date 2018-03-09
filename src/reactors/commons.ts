import { Watcher } from "./watcher";
import { IStore } from "../types";

import { indexBy } from "underscore";
import groupIdBy from "../helpers/group-id-by";

import { actions } from "../actions";
import { throttle, isEqual } from "underscore";

import rootLogger from "../logger";
import { withButlerClient, messages } from "../buse";
const logger = rootLogger.child({ name: "commons" });

async function updateCommonsNow(store: IStore) {
  await withButlerClient(logger, async client => {
    const { caves, downloadKeys, installLocations } = await client.call(
      messages.FetchCommons({})
    );

    let locationSizes = {};
    for (const x of installLocations) {
      locationSizes[x.installLocation] = x.size;
    }

    push(store, {
      caves: indexBy(caves, "id"),
      caveIdsByGameId: groupIdBy(caves, "gameId"),
      downloadKeys: indexBy(downloadKeys, "id"),
      downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
      locationSizes,
    });
  });
}

const updateCommons = throttle(updateCommonsNow, 500);

export default function(watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.logout, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      updateCommons(store);
    }
  });

  // TODO: this needs to be called on other occasions: when an install
  // or uninstall finished, for example.
}

function push(store: IStore, next: typeof actions.commonsUpdated.payload) {
  const prev = store.getState().commons;

  let hasDifferences = false;
  for (const k of Object.keys(next)) {
    if (!isEqual(prev[k], next[k])) {
      hasDifferences = true;
      break;
    }
  }

  if (hasDifferences) {
    store.dispatch(actions.commonsUpdated(next));
  }
}
