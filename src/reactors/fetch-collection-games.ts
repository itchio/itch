
import {Watcher} from "./watcher";

import mklog from "../util/log";
const log = mklog("reactors/fetch");
import {opts} from "../logger";

import {getUserMarket} from "./market";
import fetch from "../util/fetch";
import api from "../util/api";

import * as actions from "../actions";

import {IStore, IUserMarket, ICredentials} from "../types";

async function fetchSingleCollectionGames
    (store: IStore, market: IUserMarket, credentials: ICredentials, collectionId: number) {
  await fetch.collectionGames(market, credentials, collectionId);
  store.dispatch(actions.collectionGamesFetched({collectionId, fetchedAt: Date.now()}));
}

// TODO: db
// let collectionsWatcher: (state: IAppState) => void;
// const makeCollectionsWatcher = (store: IStore) => {
//   let oldIds: string[] = [];

//   return createSelector(
//     (state: IAppState) => state.market.collections,
//     (collections) => {
//       setImmediate(() => {
//         const ids = map(collections, (c, id) => id);
//         if (!isEqual(ids, oldIds)) {
//           oldIds = ids;
//           store.dispatch(actions.fetchCollectionGames({}));
//         }
//       });
//     },
//   );
// };

export default function (watcher: Watcher) {
  watcher.onDebounced(actions.fetchCollectionGames, 300, async (store, action) => {
    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      return;
    }

    const market = getUserMarket();
    const collections = market.getEntities("collections");

    try {
      for (const key of Object.keys(collections)) {
        await fetchSingleCollectionGames(store, market, credentials, Number(key));
      }
    } catch (e) {
      if (api.isNetworkError(e)) {
        log(opts, "Network error while fetching collection, skipping..");
      } else {
        throw e;
      }
    }
  });

  // TODO: db
  // watcher.on(actions.userDbCommit, async (store, action) => {
  //   if (!collectionsWatcher) {
  //     collectionsWatcher = makeCollectionsWatcher(store);
  //   }
  //   collectionsWatcher(store.getState());
  // });

  watcher.on(actions.userDbReady, async (store, action) => {
    store.dispatch(actions.fetchCollectionGames({}));
  });
}

