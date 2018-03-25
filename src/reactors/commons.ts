import { Watcher } from "./watcher";
import { IStore } from "../types";

import { indexBy, isEmpty } from "underscore";
import groupIdBy from "../helpers/group-id-by";

import { actions } from "../actions";
import { throttle, isEqual } from "underscore";

import rootLogger from "../logger";
import { messages, withLogger } from "../butlerd";
const logger = rootLogger.child({ name: "commons" });
const call = withLogger(logger);

async function updateCommonsNow(store: IStore) {
  if (!store.getState().setup.done) {
    return;
  }

  const { caves, downloadKeys, installLocations } = await call(
    messages.FetchCommons,
    {}
  );

  let locationSizes = {};
  if (!isEmpty(installLocations)) {
    for (const x of installLocations) {
      locationSizes[x.id] = x.sizeInfo.installedSize;
    }
  }

  push(store, {
    caves: indexBy(caves, "id"),
    caveIdsByGameId: groupIdBy(caves, "gameId"),
    downloadKeys: indexBy(downloadKeys, "id"),
    downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
    locationSizes,
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

  watcher.on(actions.downloadEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.uninstallEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.launchEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.newItemsImported, async (store, action) => {
    updateCommons(store);
  });
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
