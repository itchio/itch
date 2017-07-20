import { Watcher } from "../reactors/watcher";
import rootLogger from "../logger";
const logger = rootLogger.child({ name: "fetchers" });

import * as actions from "../actions";

import { Fetcher, FetchReason } from "../fetchers/types";
import { IStore } from "../types";
import DashboardFetcher from "../fetchers/dashboard-fetcher";
import CollectionsFetcher from "../fetchers/collections-fetcher";
import LibraryFetcher from "../fetchers/library-fetcher";

import GameFetcher from "../fetchers/game-fetcher";
import UserFetcher from "../fetchers/user-fetcher";
import CollectionFetcher from "../fetchers/collection-fetcher";

import { pathPrefix } from "../util/navigation";
import Context from "../context";
import { DB } from "../db";

import { some } from "underscore";

const staticFetchers = {
  dashboard: DashboardFetcher,
  collections: CollectionsFetcher,
  library: LibraryFetcher,
};

const pathFetchers = {
  games: GameFetcher,
  users: UserFetcher,
  collections: CollectionFetcher,
};

let fetching: {
  [key: string]: boolean;
} = {};

let nextFetchReason: {
  [key: string]: FetchReason;
} = {};

export async function queueFetch(
  store: IStore,
  db: DB,
  tabId: string,
  reason: FetchReason,
) {
  if (fetching[tabId]) {
    logger.debug(
      `for ${tabId}, queueing next fetch reason ${FetchReason[reason]}`,
    );
    nextFetchReason[tabId] = reason;
    return;
  }

  const fetcherClass = getFetcherClass(store, tabId);
  if (!fetcherClass) {
    return;
  }

  fetching[tabId] = true;

  const fetcher = new fetcherClass();
  const ctx = new Context(store, db);
  fetcher.hook(ctx, tabId, reason);

  fetcher
    .run()
    .catch(e => {
      // well, logging will have to do
      fetcher.logger.error(`failed: ${e.stack}`);
    })
    .then(() => {
      delete fetching[tabId];

      const nextReason = nextFetchReason[tabId];
      if (nextReason) {
        delete nextFetchReason[tabId];
        logger.debug(`now doing nextReason ${nextReason}`);
        queueFetch(store, db, tabId, nextReason).catch(err => {
          logger.error(`In queued fetcher: ${err.stack}`);
        });
      }
    });
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

  const { path } = tabData;
  if (path) {
    const pathBase = pathPrefix(path);
    const pathFetcher = pathFetchers[pathBase];
    if (pathFetcher) {
      return pathFetcher;
    }
  }

  return null;
}

export default function(watcher: Watcher, db: DB) {
  // changing tabs? it's a fetching
  watcher.on(actions.tabChanged, async (store, action) => {
    queueFetch(store, db, action.payload.id, FetchReason.TabChanged);
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.tabEvolved, async (store, action) => {
    queueFetch(store, db, action.payload.id, FetchReason.TabEvolved);
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(store, db, action.payload.id, FetchReason.TabReloaded);
  });

  // tab got new params? it's a fetching!
  watcher.on(actions.tabParamsChanged, async (store, action) => {
    queueFetch(store, db, action.payload.id, FetchReason.TabParamsChanged);
  });

  // tab got new pagination? it's a fetching
  watcher.on(actions.tabPaginationChanged, async (store, action) => {
    queueFetch(store, db, action.payload.id, FetchReason.TabPaginationChanged);
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      const currentTabId = store.getState().session.navigation.id;
      queueFetch(store, db, currentTabId, FetchReason.WindowFocused);
    }
  });

  const watchedPreferences = [
    "onlyCompatibleGames",
    "onlyInstalledGames",
    "onlyOwnedGames",
  ];

  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = action.payload;
    if (some(watchedPreferences, k => prefs.hasOwnProperty(k))) {
      const currentTabId = store.getState().session.navigation.id;
      queueFetch(store, db, currentTabId, FetchReason.TabParamsChanged);
    }
  });
}
