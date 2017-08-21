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

import Context from "../context";
import { DB } from "../db";

import { some } from "underscore";
import { Space } from "../helpers/space";

let fetching: {
  [key: string]: boolean;
} = {};

let lastFetcher: {
  [key: string]: any;
} = {};

let nextFetchReason: {
  [key: string]: FetchReason;
} = {};

export async function queueFetch(
  store: IStore,
  db: DB,
  tab: string,
  reason: FetchReason,
) {
  if (fetching[tab]) {
    logger.debug(
      `for ${tab}, queueing next fetch reason ${FetchReason[reason]}`,
    );
    nextFetchReason[tab] = reason;
    return;
  }

  const fetcherClass = getFetcherClass(store, tab);
  if (!fetcherClass) {
    return;
  }

  if (lastFetcher[tab] !== fetcherClass) {
    // TODO: ask fetcher to clean what it fetched
  }
  lastFetcher[tab] = fetcherClass;

  fetching[tab] = true;

  const fetcher = new fetcherClass();
  const ctx = new Context(store, db);
  fetcher.hook(ctx, tab, reason);

  fetcher
    .run()
    .catch(e => {
      // well, logging will have to do
      fetcher.logger.error(`failed: ${e.stack}`);
    })
    .then(() => {
      delete fetching[tab];

      const nextReason = nextFetchReason[tab];
      if (nextReason) {
        delete nextFetchReason[tab];
        logger.debug(`now doing nextReason ${nextReason}`);
        queueFetch(store, db, tab, nextReason).catch(err => {
          logger.error(`In queued fetcher: ${err.stack}`);
        });
      }
    });
}

function getFetcherClass(store: IStore, tab: string): typeof Fetcher {
  const sp = Space.for(store, tab);

  switch (sp.prefix) {
    case "dashboard":
      return DashboardFetcher;
    case "collections": {
      if (sp.suffix) {
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
    case "users":
      return UserFetcher;
    case "collections":
      return CollectionFetcher;
  }
}

export default function(watcher: Watcher, db: DB) {
  // changing tabs? it's a fetching
  watcher.on(actions.tabChanged, async (store, action) => {
    queueFetch(store, db, action.payload.tab, FetchReason.TabChanged);
  });

  // tab navigated to something else? let's fetch
  watcher.on(actions.tabEvolved, async (store, action) => {
    queueFetch(store, db, action.payload.tab, FetchReason.TabEvolved);
  });

  // tab reloaded by user? let's fetch!
  watcher.on(actions.tabReloaded, async (store, action) => {
    queueFetch(store, db, action.payload.tab, FetchReason.TabReloaded);
  });

  // tab got new params? it's a fetching!
  watcher.on(actions.tabParamsChanged, async (store, action) => {
    queueFetch(store, db, action.payload.tab, FetchReason.TabParamsChanged);
  });

  // window gaining focus? fetch away!
  watcher.on(actions.windowFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      const currentTab = store.getState().session.navigation.tab;
      queueFetch(store, db, currentTab, FetchReason.WindowFocused);
    }
  });

  watcher.on(actions.commonsUpdated, async (store, action) => {
    const currentTab = store.getState().session.navigation.tab;
    queueFetch(store, db, currentTab, FetchReason.WindowFocused);
  });

  const watchedPreferences = [
    "onlyCompatibleGames",
    "onlyInstalledGames",
    "onlyOwnedGames",
  ];

  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = action.payload;
    if (some(watchedPreferences, k => prefs.hasOwnProperty(k))) {
      const currentTabId = store.getState().session.navigation.tab;
      queueFetch(store, db, currentTabId, FetchReason.TabParamsChanged);
    }
  });
}
