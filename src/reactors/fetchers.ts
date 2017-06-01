
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
import UserFetcher from "../fetchers/user-fetcher";
import CollectionFetcher from "../fetchers/collection-fetcher";

import {pathPrefix} from "../util/navigation";

const staticFetchers = {
  "dashboard": DashboardFetcher,
  "collections": CollectionsFetcher,
  "library": LibraryFetcher,
};

const pathFetchers = {
  "games": GameFetcher,
  "users": UserFetcher,
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

  const fetcherClass = getFetcherClass(store, tabId);
  if (!fetcherClass) {
    return;
  }

  fetching[tabId] = true;

  const fetcher = new fetcherClass();
  fetcher.hook(store, tabId, reason);

  fetcher.emitter.on("done", () => {
    delete fetching[tabId];

    const nextReason = nextFetchReason[tabId];
    if (nextReason) {
      delete nextFetchReason[tabId];
      queueFetch(store, tabId, nextReason).catch((err) => {
        logger.error(`In queued fetcher: ${err.stack}`);
      });
    }
  });

  fetcher.start();
}

function getFetcherClass(store: IStore, tabId: string): typeof Fetcher {
  let staticFetcher = staticFetchers[tabId];
  if (staticFetcher) {
    return staticFetcher;
  }

  const tabData = store.getState().session.tabData[tabId];
  if (!tabData) {
    return null;
  }

  const {path} = tabData;
  if (path) {
    const pathBase = pathPrefix(path);
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
    queueFetch(store, action.payload.id, FetchReason.TabChanged);
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.tabEvolved, async (store, action) => {
    queueFetch(store, action.payload.id, FetchReason.TabEvolved);
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(store, action.payload.id, FetchReason.TabReloaded);
  });

  // tab got new params? it's a fetching!
  watcher.on(actions.tabParamsChanged, async (store, action) => {
    queueFetch(store, action.payload.id, FetchReason.TabParamsChanged);
  });

  // tab got new pagination? it's a fetching
  watcher.on(actions.tabPaginationChanged, async (store, action) => {
    queueFetch(store, action.payload.id, FetchReason.TabPaginationChanged);
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      const currentTabId = store.getState().session.navigation.id;
      queueFetch(store, currentTabId, FetchReason.WindowFocused);
    }
  });
}
