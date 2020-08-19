import { actions } from "common/actions";
import { messages } from "common/butlerd";
import groupIdBy from "common/helpers/group-id-by";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { indexBy, isEmpty, isEqual, throttle } from "underscore";

const logger = mainLogger.child(__filename);

async function updateCommonsNow(store: Store) {
  try {
    await updateCommonsNowThrows(store);
  } catch (e) {
    logger.warn(`While fetching commons: ${e.stack}`);
  }
}

async function updateCommonsNowThrows(store: Store) {
  if (!store.getState().setup.done) {
    return;
  }

  const { caves, downloadKeys, installLocations } = await mcall(
    messages.FetchCommons,
    {}
  );

  let locationSizes: { [key: string]: number } = {};
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

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.loggedOut, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.windFocusChanged, async (store, action) => {
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

  watcher.on(actions.ownedKeysFetched, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.installLocationsChanged, async (store, action) => {
    updateCommons(store);
  });
}

function push(store: Store, next: typeof actions.commonsUpdated.payload) {
  const prev = store.getState().commons;

  let hasDifferences = false;
  for (const k of Object.keys(next)) {
    if (!isEqual((prev as any)[k], (next as any)[k])) {
      hasDifferences = true;
      break;
    }
  }

  if (hasDifferences) {
    store.dispatch(actions.commonsUpdated(next));
  }
}
