
import {Watcher} from "../reactors/watcher";
const debug = require("debug")("itch:tab-fetcher");

import * as actions from "../actions";

import {Fetcher, FetchReason} from "../fetchers/types";
import {IStore} from "../types";
import {IMarketGetter} from "../fetchers/types";
import DashboardFetcher from "../fetchers/dashboard-fetcher";
import CollectionsFetcher from "../fetchers/collections-fetcher";

const staticFetchers = {
  "dashboard": DashboardFetcher,
  "collections": CollectionsFetcher,
};

export function queueFetch (store: IStore, tabId: string, reason: FetchReason, getMarkets: IMarketGetter) {
  debug(`Queuing fetch for "${tabId}" because ${reason}`);

  const fetcherClass = getFetcherClass(tabId);
  if (!fetcherClass) {
    debug(`No fetcher for "${tabId}", nothing to do`);
    return;
  }

  const fetcher = new fetcherClass();
  fetcher.hook(store, tabId, reason, getMarkets);
  fetcher.start();
}

function getFetcherClass(tabId): typeof Fetcher {
  let staticFetcher = staticFetchers[tabId];
  if (staticFetcher) {
    return staticFetcher;
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

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      queueFetch(store, store.getState().session.navigation.id, "window-focused", watcher.getMarkets);
    }
  });
}
