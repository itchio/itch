import { Watcher } from "common/util/watcher";
import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "fetchers" });

import { actions } from "common/actions";

import { Fetcher, FetchReason } from "../fetchers/fetcher";
import { IStore } from "common/types";
import DashboardFetcher from "../fetchers/dashboard-fetcher";
import CollectionsFetcher from "../fetchers/collections-fetcher";
import LibraryFetcher from "../fetchers/library-fetcher";

import GameFetcher from "../fetchers/game-fetcher";
import CollectionFetcher from "../fetchers/collection-fetcher";
import LocationFetcher from "../fetchers/location-fetcher";
import AppLogFetcher from "../fetchers/applog-fetcher";

import { Context } from "../context";

import { some, throttle, union } from "underscore";
import { Space } from "common/helpers/space";

let fetching: {
  [key: string]: boolean;
} = {};

let lastFetchers: {
  [key: string]: any;
} = {};

let nextFetchReason: {
  [key: string]: FetchReason;
} = {};

// FIXME: fetchers are very much not multi-window-aware

async function queueFetch(
  store: IStore,
  window: string,
  tab: string,
  reason: FetchReason
) {
  if (fetching[tab]) {
    nextFetchReason[tab] = reason;
    return;
  }

  const fetcherClass = getFetcherClass(store, window, tab);
  if (!fetcherClass) {
    // no fetcher, nothing to do
    return;
  }

  const lastFetcher = lastFetchers[tab];
  if (lastFetcher && lastFetcher.constructor !== fetcherClass) {
    try {
      lastFetcher.clean();
      delete lastFetchers[tab];
    } catch (e) {
      logger.warn(
        `While cleaning ${lastFetcher.constructor.name} => ${
          fetcherClass.name
        } for ${tab}: ${e.stack}`
      );
    }
  }

  fetching[tab] = true;

  const fetcher = new fetcherClass();
  lastFetchers[tab] = fetcher;
  const ctx = new Context(store);
  fetcher.hook(ctx, tab, reason);

  const t1 = Date.now();
  fetcher
    .run()
    .catch(e => {
      // well, logging will have to do
      fetcher.logger.error(`failed: ${e.stack}`);
    })
    .then(() => {
      const t2 = Date.now();
      fetcher.logger.debug(`finished in ${(t2 - t1).toFixed()}ms`);
      delete fetching[tab];

      const nextReason = nextFetchReason[tab];
      if (nextReason) {
        delete nextFetchReason[tab];
        queueFetch(store, window, tab, nextReason).catch(err => {
          logger.error(`In queued fetcher: ${err.stack}`);
        });
      }
    });
}

function getFetcherClass(
  store: IStore,
  window: string,
  tab: string
): typeof Fetcher {
  const sp = Space.fromStore(store, window, tab);

  switch (sp.internalPage()) {
    case "dashboard":
      return DashboardFetcher;
    case "collections": {
      if (sp.firstPathElement()) {
        return CollectionFetcher;
      } else {
        return CollectionsFetcher;
      }
    }
    case "dashboard":
      return DashboardFetcher;
    case "library":
      return LibraryFetcher;
    case "games":
      return GameFetcher;
    case "collections":
      return CollectionFetcher;
    case "locations":
      return LocationFetcher;
    case "applog":
      return AppLogFetcher;
  }

  switch (sp.prefix) {
    case "games":
      return GameFetcher;
  }
  return null;
}

const queueCleanup = throttle((store: IStore) => {
  // TODO: figure that out multi-window
  const validKeys = new Set(
    Object.keys(store.getState().windows["root"].tabInstances)
  );

  const allKeys = union(
    Object.keys(lastFetchers),
    Object.keys(nextFetchReason),
    Object.keys(fetching)
  );
  for (const k of allKeys) {
    if (!validKeys.has(k)) {
      logger.debug(`Cleaning up ${k}`);
      delete lastFetchers[k];
      delete fetching[k];
      delete nextFetchReason[k];
    }
  }
}, 3000 /* space out cleanups */);

export default function(watcher: Watcher) {
  // changing tabs? it's a fetching
  watcher.on(actions.tabChanged, async (store, action) => {
    const { window, tab } = action.payload;
    queueFetch(store, window, tab, FetchReason.TabChanged);
  });

  watcher.on(actions.tabsChanged, async (store, action) => {
    queueCleanup(store);
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.evolveTab, async (store, action) => {
    const { onlyParamsChange } = action.payload;
    const reason = onlyParamsChange
      ? FetchReason.ParamsChanged
      : FetchReason.TabEvolved;
    queueFetch(store, action.payload.window, action.payload.tab, reason);
  });

  watcher.on(actions.tabGoBack, async (store, action) => {
    queueFetch(
      store,
      action.payload.window,
      action.payload.tab,
      FetchReason.TabEvolved
    );
  });

  watcher.on(actions.tabGoForward, async (store, action) => {
    queueFetch(
      store,
      action.payload.window,
      action.payload.tab,
      FetchReason.TabEvolved
    );
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(
      store,
      action.payload.window,
      action.payload.tab,
      FetchReason.TabReloaded
    );
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      const currentTab = store.getState().windows["root"].navigation.tab;
      queueFetch(store, "root", currentTab, FetchReason.WindowFocused);
    }
  });

  watcher.on(actions.commonsUpdated, async (store, action) => {
    const currentTab = store.getState().windows["root"].navigation.tab;
    queueFetch(store, "root", currentTab, FetchReason.CommonsChanged);
  });

  const watchedPreferences = [
    "onlyCompatibleGames",
    "onlyInstalledGames",
    "onlyOwnedGames",
  ];

  watcher.on(actions.updatePreferences, async (store, action) => {
    // FIXME: multiwindow
    const prefs = action.payload;
    if (some(watchedPreferences, k => prefs.hasOwnProperty(k))) {
      const currentTabId = store.getState().windows["root"].navigation.tab;
      queueFetch(store, "root", currentTabId, FetchReason.ParamsChanged);
    }
  });
}
