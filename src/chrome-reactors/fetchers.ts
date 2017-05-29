
import {Watcher} from "../reactors/watcher";
import rootLogger from "../logger";
const logger = rootLogger.child({name: "fetchers"});

import * as actions from "../actions";

import {Fetcher, FetchReason} from "../fetchers/types";
import {IStore} from "../types";
import DashboardFetcher from "../fetchers/dashboard-fetcher";
import CollectionsFetcher from "../fetchers/collections-fetcher";
import LibraryFetcher from "../fetchers/library-fetcher";

import GameFetcher from "../fetchers/game-fetcher";
import CollectionFetcher from "../fetchers/collection-fetcher";

const staticFetchers = {
  "dashboard": DashboardFetcher,
  "collections": CollectionsFetcher,
  "library": LibraryFetcher,
};

const pathFetchers = {
  "games": GameFetcher,
  "collections": CollectionFetcher,
};

let fetching: {
  [key: string]: boolean;
} = {};

let nextFetchReason: {
  [key: string]: FetchReason;
} = {};

export async function queueFetch (store: IStore, tabId: string, reason: FetchReason) {
  if (fetching[tabId]) {
    nextFetchReason[tabId] = reason;
    return;
  }

  fetching[tabId] = true;

  const fetcherClass = getFetcherClass(store, tabId);
  if (!fetcherClass) {
    return;
  }

  const fetcher = new fetcherClass();
  fetcher.hook(store, tabId, reason);

  fetcher.emitter.on("done", () => {
    delete fetching[tabId];

    const nextReason = nextFetchReason[tabId];
    if (nextReason) {
      delete nextFetchReason[tabId];
      queueFetch(store, tabId, nextReason);
    }
  });

  fetcher.start();
}

function getFetcherClass(store: IStore, tabId: string): typeof Fetcher {
  let staticFetcher = staticFetchers[tabId];
  if (staticFetcher) {
    return staticFetcher;
  }

  const path = store.getState().session.navigation.tabData[tabId].path;
  if (path) {
    const pathBase = path.substr(0, path.indexOf("/"));
    const pathFetcher = pathFetchers[pathBase];
    if (pathFetcher) {
      return pathFetcher;
    }
  }

  return null;
}

export default function (watcher: Watcher) {
  // changing tabs? it's a fetching
  watcher.on(actions.tabChanged, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-changed");
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.tabEvolved, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-evolved");
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-reloaded");
  });

  // tab got new params? it's a fetching!
  watcher.on(actions.tabParamsChanged, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-params-changed");
  });

  // tab got new filter? it's a fetching!
  watcher.on(actions.filterChanged, async (store, action) => {
    queueFetch(store, action.payload.tab, "tab-filter-changed");
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      queueFetch(store, store.getState().session.navigation.id, "window-focused");
    }
  });
}
