
import {Watcher} from "../reactors/watcher";
const debug = require("debug")("itch:tab-fetcher");

import * as actions from "../actions";

import {Fetcher, FetchReason} from "../fetchers/types";
import {IStore} from "../types";
import {IMarketGetter} from "../fetchers/types";
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

let currentFetchers: any = {};
let waitingFor: {
  [key: string]: boolean;
} = {};

export async function queueFetch (store: IStore, tabId: string, reason: FetchReason, getMarkets: IMarketGetter) {
  debug(`Queuing fetch for "${tabId}" because ${reason}`);

  if (currentFetchers[tabId]) {
    if (waitingFor[tabId]) {
      debug(`Debounced "${tabId}" fetch`);
      // this isn't great because the fetch might be different depending on `reason`
      return;
    }
    waitingFor[tabId] = true;
    await new Promise((resolve, reject) => {
      currentFetchers[tabId].emitter.on("done", resolve);
    });
    delete waitingFor[tabId];
  }

  const fetcherClass = getFetcherClass(store, tabId);
  if (!fetcherClass) {
    debug(`No fetcher for "${tabId}", nothing to do`);
    return;
  }

  const fetcher = new fetcherClass();
  currentFetchers[tabId] = fetcher;
  fetcher.hook(store, tabId, reason, getMarkets);
  fetcher.start();
  fetcher.emitter.on("done", () => {
    delete currentFetchers[tabId];
  });
}

function getFetcherClass(store: IStore, tabId: string): typeof Fetcher {
  let staticFetcher = staticFetchers[tabId];
  if (staticFetcher) {
    return staticFetcher;
  }

  const path = store.getState().session.navigation.tabData[tabId].path;
  if (path) {
    const pathBase = path.substr(0, path.indexOf("/"));
    debug(`path base = ${pathBase}`);
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
    queueFetch(store, action.payload.id, "tab-changed", watcher.getMarkets);
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.tabEvolved, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-evolved", watcher.getMarkets);
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-reloaded", watcher.getMarkets);
  });

  // tab got new params? it's a fetching!
  watcher.on(actions.tabParamsChanged, async (store, action) => {
    queueFetch(store, action.payload.id, "tab-params-changed", watcher.getMarkets);
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      queueFetch(store, store.getState().session.navigation.id, "window-focused", watcher.getMarkets);
    }
  });
}
