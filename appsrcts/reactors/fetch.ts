
import * as bluebird from "bluebird";
import * as invariant from "invariant";

import {createSelector} from "reselect";

import mklog from "../util/log";
const log = mklog("reactors/fetch");
import {opts} from "../logger";

import {getUserMarket} from "./market";
import fetch from "../util/fetch";
import api from "../util/api";

import {map, isEqual} from "underscore";
import debounce from "./debounce";

import * as actions from "../actions";

import {IStore, IState, IMarket, ICredentials} from "../types";
import {
  IAction,
  IWindowFocusChangedPayload,
  IPurchaseCompletedPayload,
  ILoginSucceededPayload,
  ISearchPayload,
  IDbCommitPayload,
  IDbReadyPayload,
} from "../constants/action-types";

async function windowFocusChanged (store: IStore, action: IAction<IWindowFocusChangedPayload>) {
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
}

async function loginSucceeded (store: IStore, action: IAction<ILoginSucceededPayload>) {
  const credentials = action.payload;
  await fetchUsuals(credentials);
}

async function purchaseCompleted (store: IStore, action: IAction<IPurchaseCompletedPayload>) {
  const credentials = store.getState().session.credentials;
  if (!credentials.key) {
    log(opts, "Not logged in, not fetching anything yet");
    return;
  }

  await fetchUsuals(credentials);
}

const fetchUsuals = debounce(async function fetchUsuals (credentials: ICredentials) {
  invariant(credentials.key, "have API key");

  log(opts, "Fetching the usuals");

  const market = getUserMarket();

  try {
    await bluebird.all([
      fetch.dashboardGames(market, credentials),
      fetch.ownedKeys(market, credentials),
      fetch.collections(market, credentials),
    ]);
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping fetch usuals, having network issues (${e.code})`);
    } else {
      throw e;
    }
  }
}, 300);

const search = async function search (store: IStore, action: IAction<ISearchPayload>) {
  store.dispatch(actions.searchStarted());

  try {
    const credentials = store.getState().session.credentials;
    if (!credentials.key) {
      log(opts, "Not logged in, can\'t search");
      return;
    }

    const query = action.payload;
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
    store.dispatch(actions.searchFinished());
  }
};

async function fetchSingleCollectionGames
    (store: IStore, market: IMarket, credentials: ICredentials, collectionId: number) {
  await fetch.collectionGames(market, credentials, collectionId);
  store.dispatch(actions.collectionGamesFetched({collectionId}));
}

const fetchCollectionGames = debounce(async function fetchCollectionGames (store, action) {
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
}, 300);

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
          store.dispatch(actions.fetchCollectionGames());
        }
      });
    },
  );
};

async function userDbCommit (store: IStore, action: IAction<IDbCommitPayload>) {
  if (!collectionsWatcher) {
    collectionsWatcher = makeCollectionsWatcher(store);
  }
  collectionsWatcher(store.getState());
}

async function userDbReady (store: IStore, action: IAction<IDbReadyPayload>) {
  await fetchCollectionGames(store, action);
}

export default {windowFocusChanged, loginSucceeded, purchaseCompleted,
  fetchCollectionGames, userDbCommit, userDbReady, search};
