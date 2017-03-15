
import {Watcher} from "./watcher";

import * as bluebird from "bluebird";
import * as invariant from "invariant";

import {createSelector} from "reselect";

import mklog from "../util/log";
const log = mklog("reactors/fetch");
import {opts} from "../logger";

import {getUserMarket, getGlobalMarket} from "./market";
import fetch from "../util/fetch";
import api from "../util/api";

import {map, isEqual} from "underscore";
import debounce from "./debounce";

import * as actions from "../actions";

import {IStore, IState, IUserMarket, ICredentials} from "../types";

const fetchUsuals = debounce(async function fetchUsuals (credentials: ICredentials) {
  invariant(credentials.key, "have API key");

  log(opts, "Fetching the usuals");

  const market = getUserMarket();
  const globalMarket = getGlobalMarket();

  try {
    await bluebird.all([
      fetch.dashboardGames(market, credentials),
      fetch.ownedKeys(market, globalMarket, credentials),
      fetch.collections(market, credentials),
    ]);
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping fetch usuals, having network issues (${e.message})`);
    } else {
      throw e;
    }
  }
}, 300);

async function fetchSingleCollectionGames
    (store: IStore, market: IUserMarket, credentials: ICredentials, collectionId: number) {
  await fetch.collectionGames(market, credentials, collectionId);
  store.dispatch(actions.collectionGamesFetched({collectionId}));
}

let collectionsWatcher: (state: IState) => void;
const makeCollectionsWatcher = (store: IStore) => {
  let oldIds: string[] = [];

  return createSelector(
    (state: IState) => state.market.collections,
    (collections) => {
      setImmediate(() => {
        const ids = map(collections, (c, id) => id);
        if (!isEqual(ids, oldIds)) {
          oldIds = ids;
          store.dispatch(actions.fetchCollectionGames({}));
        }
      });
    },
  );
};

export default function (watcher: Watcher) {
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    const {focused} = action.payload;
    if (!focused) {
      // app just went in the background, nbd
      return;
    }

    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      log(opts, "Not logged in, not fetching anything yet");
      return;
    }

    await fetchUsuals(credentials);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    const credentials = action.payload;
    await fetchUsuals(credentials);
  });

  watcher.on(actions.purchaseCompleted, async (store, action) => {
    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      log(opts, "Not logged in, not fetching anything yet");
      return;
    }

    await fetchUsuals(credentials);
  });

  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    try {
      const credentials = store.getState().session.credentials;
      if (!credentials.key) {
        log(opts, "Not logged in, can\'t search");
        return;
      }

      if (!query) {
        log(opts, "Clearing query");
        store.dispatch(actions.searchFetched({query: "", results: null}));
        return;
      }

      const results = await fetch.search(credentials, query);
      store.dispatch(actions.searchFetched({query, results}));
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });

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

  watcher.on(actions.userDbCommit, async (store, action) => {
    if (!collectionsWatcher) {
      collectionsWatcher = makeCollectionsWatcher(store);
    }
    collectionsWatcher(store.getState());
  });

  watcher.on(actions.userDbReady, async (store, action) => {
    store.dispatch(actions.fetchCollectionGames({}));
  });
}
