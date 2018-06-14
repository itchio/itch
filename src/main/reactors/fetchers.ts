import { Watcher } from "common/util/watcher";
import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "fetchers" });

import { actions } from "common/actions";

import { Fetcher, FetchReason } from "../fetchers/fetcher";
import { IStore } from "common/types";
import DashboardFetcher from "../fetchers/dashboard-fetcher";
import LibraryFetcher from "../fetchers/library-fetcher";

import LocationFetcher from "../fetchers/location-fetcher";
import AppLogFetcher from "../fetchers/applog-fetcher";

import { Context } from "../context";

import { some, throttle, union } from "underscore";
import { Space } from "common/helpers/space";

interface WindowFetchState {
  fetching: {
    [tab: string]: boolean;
  };
  lastFetchers: {
    [tab: string]: any;
  };
  nextFetchReason: {
    [tab: string]: FetchReason;
  };
}

interface WindowsFetchState {
  [windowId: string]: WindowFetchState;
}

const fes: WindowsFetchState = {};

function getWindowFetchState(window: string) {
  if (!fes[window]) {
    fes[window] = {
      fetching: {},
      lastFetchers: {},
      nextFetchReason: {},
    };
  }
  return fes[window];
}

// FIXME: fetchers are very much not multi-window-aware

async function queueFetch(
  store: IStore,
  window: string,
  tab: string,
  reason: FetchReason
) {
  const wfes = getWindowFetchState(window);

  if (wfes.fetching[tab]) {
    wfes.nextFetchReason[tab] = reason;
    return;
  }

  const fetcherClass = getFetcherClass(store, window, tab);
  if (!fetcherClass) {
    // no fetcher, nothing to do
    return;
  }

  const lastFetcher = wfes.lastFetchers[tab];
  if (lastFetcher && lastFetcher.constructor !== fetcherClass) {
    try {
      lastFetcher.clean();
      delete wfes.lastFetchers[tab];
    } catch (e) {
      logger.warn(
        `While cleaning ${lastFetcher.constructor.name} => ${
          fetcherClass.name
        } for ${tab}: ${e.stack}`
      );
    }
  }

  wfes.fetching[tab] = true;

  const fetcher = new fetcherClass();
  wfes.lastFetchers[tab] = fetcher;
  const ctx = new Context(store);
  fetcher.hook(ctx, window, tab, reason);

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
      delete wfes.fetching[tab];

      const nextReason = wfes.nextFetchReason[tab];
      if (nextReason) {
        delete wfes.nextFetchReason[tab];
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
    case "library":
      return LibraryFetcher;
    case "locations":
      return LocationFetcher;
    case "applog":
      return AppLogFetcher;
  }
  return null;
}

const queueCleanup = throttle((store: IStore, window: string) => {
  // TODO: figure that out multi-window
  const validKeys = new Set(
    Object.keys(store.getState().windows[window].tabInstances)
  );

  const wfs = getWindowFetchState(window);

  const allKeys = union(
    Object.keys(wfs.lastFetchers),
    Object.keys(wfs.nextFetchReason),
    Object.keys(wfs.fetching)
  );
  for (const k of allKeys) {
    if (!validKeys.has(k)) {
      logger.debug(`Cleaning up ${k}`);
      delete wfs.lastFetchers[k];
      delete wfs.fetching[k];
      delete wfs.nextFetchReason[k];
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
    const { window } = action.payload;
    queueCleanup(store, window);
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

  watcher.on(actions.windowClosed, async (store, action) => {
    const { window } = action.payload;
    delete fes[window];
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
