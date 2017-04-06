
import {Watcher} from "./watcher";

import {createStructuredSelector, createSelector} from "reselect";
import {getUserMarket} from "./market";

import * as invariant from "invariant";
import * as ospath from "path";
import * as urlParser from "url";
import * as querystring from "querystring";

import {map, filter, pluck} from "underscore";

import {shell} from "../electron";

import staticTabData from "../constants/static-tab-data";

import {pathToId, gameToTabData, userToTabData, collectionToTabData, locationToTabData} from "../util/navigation";
import fetch from "../util/fetch";
import api from "../util/api";
import pathmaker from "../util/pathmaker";
import Market from "../util/market";

import mklog from "../util/log";
import {opts} from "../logger";
const log = mklog("reactors/navigation");

const TABS_TABLE_NAME = "itchAppTabs";

import * as actions from "../actions";

import {IStore, IAppState, ITabData, ITabDataSet, IItchAppTabs} from "../types";

interface IRetrieveOpts {
  /** when set, use this path to retrieve data instead of the tab's existing path */
  path?: string;

  /** when set, do not use any cached data, only fresh from API */
  fresh?: boolean;

  extras?: ITabData;
}

async function retrieveTabData (store: IStore, id: string, retrOpts = {} as IRetrieveOpts): Promise<ITabData> {
  store.dispatch(actions.tabLoading({id, loading: true}));
  try {
    if (!id) {
      return;
    }

    const data = store.getState().session.navigation.tabData[id];
    if (!data) {
      // tab was closed since
      return;
    }

    const path = retrOpts.path || data.path;
    if (staticTabData[id] && id !== path) {
      console.log(`Refusing to retrieve foreign tabData for frozen tab ${id}`); // tslint:disable-line:no-console
      return;
    }

    const credentials = store.getState().session.credentials;

    if (/^games/.test(path)) {
      let extraOpts = {} as {
        password?: string;
        secret?: string;
      };

      const {query} = urlParser.parse(path);
      if (query) {
        const {secret, password} = querystring.parse(query);
        if (secret)   { extraOpts.secret = secret; }
        if (password) { extraOpts.password = password; }
      }

      const game = await fetch.gameLazily(getUserMarket(), credentials, +pathToId(path),
        {...retrOpts, ...extraOpts});
      return game && gameToTabData(game);
    } else if (/^users/.test(path)) {
      const user = await fetch.userLazily(getUserMarket(), credentials, +pathToId(path), retrOpts);
      return user && userToTabData(user);
    } else if (/^collections\//.test(path)) {
      const collectionId = +pathToId(path);
      const collection = await fetch.collectionLazily(getUserMarket(), credentials, collectionId, retrOpts);
      const newData = collectionToTabData(collection);
      if (collection) {
        log(opts, `fetched collection ${collectionId}`);
        const oldCollectionData = (((data || {}).collections || {})[collectionId] || {});

        const fetchMarket = new Market();
        fetchMarket.data = {
          collections: {
            ...newData.collections,
            [collectionId]: {
              ...oldCollectionData,
              ...newData.collections[collectionId],
            },
          },
        };

        try {
          await fetch.collectionGames(fetchMarket, credentials, collectionId);
        } catch (err) {
          if (api.isNetworkError(err)) {
            // oh well, let's just go with cached games
          } else {
            // otherwise, rethrow
            throw err;
          }
        }
        return {
          ...newData,
          ...fetchMarket.data,
        };
      } else {
        return null;
      }
    } else if (/^locations/.test(path)) {
      const locationName = pathToId(path);
      let location = store.getState().preferences.installLocations[locationName];
      if (!location) {
        if (locationName === "appdata") {
          const userDataPath = store.getState().system.userDataPath;
          location = {
            path: ospath.join(userDataPath, "apps"),
          };
        }
      }

      return location && locationToTabData(location);
    } else if (/^search/.test(path)) {
      return {
        label: pathToId(path),
      };
    } else if (/^new/.test(path)) {
      return {
        label: ["sidebar.empty"],
      };
    } else if (/^toast/.test(path)) {
      return {
        label: ["sidebar.aw_snap"],
      };
    } else if (/^url/.test(path)) {
      const existingTabData = store.getState().session.navigation.tabData[id] || {};
      return {
        label: existingTabData.webTitle || (urlParser.parse(pathToId(path)) || {}).hostname,
        iconImage: existingTabData.webFavicon,
      };
    } else {
      const staticData = staticTabData[id];
      if (id) {
        return staticData;
      }
    }
  } finally {
    store.dispatch(actions.tabLoading({id, loading: false}));
  }
}

function toast (store: IStore, id: string, e: Error, path: string) {
  const data = store.getState().session.navigation.tabData[id];
  if (!data) {
    const logMsg = `Can't retrieve path for toasted tab ${id}, not found in list. Stack: ${new Error().stack}`;
    console.log(logMsg); // tslint:disable-line:no-console
    return;
  }
  const oldPath = path || data.path;
  if (/^toast/.test(oldPath)) {
    // already toasted
  } else {
    store.dispatch(actions.evolveTab({
      id,
      path: `toast/${oldPath}`,
      extras: {
        error: e.toString(),
        stack: e.stack || "no stack",
        label: null,
      },
    }));
  }
}

async function doFetchTabData (store: IStore, id: string, retrOpts?: IRetrieveOpts): Promise<void> {
  invariant(typeof store === "object", "doFetchTabData has a store");

  const timestamp = +new Date();
  try {
    const data = await retrieveTabData(store, id, retrOpts);
    if (data) {
      store.dispatch(actions.tabDataFetched({id, timestamp, data}));
    }
  } catch (e) {
    if (api.isNetworkError(e)) {
      log(opts, `Skipping tab data fetching because of network (${e.message})`);
    } else {
      log(opts, `Tab data fetching error: ${e.stack || e.message || e}`);
      toast(store, id, e, retrOpts ? retrOpts.path : id);
    }
  }
}

let saveTabs = false;

let pathSelector: (state: IAppState) => void;
const makePathSelector = (store: IStore) => createSelector(
  (state: IAppState) => state.session.navigation.id,
  (id) => {
    setImmediate(() => {
      store.dispatch(actions.tabChanged({id}));
    });
  },
);

// TODO: find less convoluted way to do that
let transientSelector: (state: IAppState) => void;

interface ITransientState {
  transient: string[];
  tabData: ITabDataSet[];
  id: string;
}

const makeTransientSelector = (store: IStore) => {
  const innerSelector = createSelector(
    (state: ITransientState) => state.transient,
    (state: ITransientState) => pluck(state.tabData, "path"),
    (state: ITransientState) => state.id,
    (ids: string[], paths: string[], id: string) => {
      setImmediate(() => store.dispatch(actions.tabsChanged(store)));
    },
  );

  return createSelector(
    createStructuredSelector({
      transient: (state: IAppState) => state.session.navigation.tabs.transient,
      tabData: (state: IAppState) => state.session.navigation.tabData,
      id: (state: IAppState) => state.session.navigation.id,
    }),
    innerSelector,
  );
};

export default function (watcher: Watcher) {
  watcher.onAll(async (store, action) => {
    const state = store.getState();

    if (pathSelector) {
      pathSelector(state);
    }

    if (transientSelector) {
      transientSelector(state);
    }
  });

  watcher.on(actions.windowReady, async (store, action) => {
    if (!pathSelector) {
      pathSelector = makePathSelector(store);
    }
    if (!transientSelector) {
      transientSelector = makeTransientSelector(store);
    }
  });

  watcher.on(actions.sessionReady, async (store, action) => {
    log(opts, "Session ready! looking for tabs to restore");
    const userMarket = getUserMarket();
    const snapshot = userMarket.getEntity<IItchAppTabs>(TABS_TABLE_NAME, "x");

    if (snapshot) {
      log(opts, `Restoring ${snapshot.items.length} tabs`);
      store.dispatch(actions.tabsRestored(snapshot));

      for (const item of snapshot.items) {
        const {id, path} = item;
        doFetchTabData(store, id, {path});
      }
    } else {
      log(opts, "No tabs to restore");
    }

    saveTabs = true;
  });

  watcher.on(actions.tabReloaded, async (store, action) => {
    const {id} = action.payload;
    invariant(typeof id === "string", "tabReloaded has string id");
    await doFetchTabData(store, id);
  });

  watcher.on(actions.windowFocusChanged, async (store, action) => {
    const {focused} = action.payload;
    if (!focused) {
      return;
    }

    const id = store.getState().session.navigation.id;
    await doFetchTabData(store, id, {fresh: true});
  });

  watcher.on(actions.evolveTab, async (store, action) => {
    const {id, path, extras = {}, quick} = action.payload;
    if (quick) {
      store.dispatch(actions.tabEvolved({id, data: {path}}));
    }

    try {
      const data = await retrieveTabData(store, id, {path, extras});
      store.dispatch(actions.tabEvolved({
        id,
        data: {...data, ...extras, path},
      }));
    } catch (e) {
      if (api.hasAPIError(e, "invalid game")) {
        log(opts, `Got invalid game, ignoring`);
      } else {
        log(opts, `While evolving tab: ${e.stack || e}`);
        toast(store, id, e, path);
      }
    }
  });

  watcher.on(actions.probeCave, async (store, action) => {
    const {caveId} = action.payload;

    const caveLogPath = pathmaker.caveLogPath(caveId);
    log(opts, `Opening cave log path ${caveLogPath}`);
    shell.openItem(caveLogPath);
  });

  watcher.on(actions.tabsChanged, async (store, action) => {
    const key = store.getState().session.credentials.key;
    if (!key || !saveTabs) {
      log(opts, "Not logged in, not saving tabs yet...");
      return;
    }

    const nav = store.getState().session.navigation;
    const {tabs, tabData, id} = nav;
    const {transient} = tabs;

    const snapshot = {
      current: id,
      items: filter(map(transient, (itemId) => {
        const data = tabData[itemId];
        if (data) {
          return {
            id: itemId,
            path: (data.path || "").replace(/^toast\//, ""),
            webTitle: data.webTitle,
            webFavicon: data.webFavicon,
          };
        }
      }), (x) => !!x),
    };

    const userMarket = getUserMarket();
    await userMarket.saveAllEntities({
      entities: {
        [TABS_TABLE_NAME]: {
          x: snapshot,
        },
      },
    }, {wait: true});
  });

  watcher.on(actions.tabChanged, async (store, action) => {
    const {id} = action.payload;
    invariant(typeof id === "string", "tabChanged has string id");

    if (id === "history") {
      store.dispatch(actions.historyRead({}));
    }

    await doFetchTabData(store, id);
  });

  watcher.on(actions.logout, async (store, action) => {
    saveTabs = false;
  });

  watcher.on(actions.clearFilters, async (store, action) => {
    const {tab} = action.payload;

    store.dispatch(actions.updatePreferences({onlyCompatibleGames: false}));
    store.dispatch(actions.filterChanged({tab, query: ""}));
  });
}
