
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

let currentFetchers: any = {};
let waitingFor: {
  [key: string]: NodeJS.Timer;
} = {};

export async function queueFetch (store: IStore, tabId: string, reason: FetchReason) {
  if (waitingFor[tabId]) {
    clearTimeout(waitingFor[tabId]);
  }

  waitingFor[tabId] = setTimeout(() => {
    delete waitingFor[tabId];
    logger.info(tabId, reason, ", reloading.");

    const fetcherClass = getFetcherClass(store, tabId);
    if (!fetcherClass) {
      return;
    }

    const fetcher = new fetcherClass();
    currentFetchers[tabId] = fetcher;
    fetcher.hook(store, tabId, reason);
    fetcher.start();
    fetcher.emitter.on("done", () => {
      delete currentFetchers[tabId];
    });
  }, 250);
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

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      queueFetch(store, store.getState().session.navigation.id, "window-focused");
    }
  });
}
