import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-persist" });

import { DB } from "../../db/db";
import { IStore, IDownloadItem, IRootState } from "../../types/index";

import * as _ from "underscore";
import { createSelector } from "reselect";

function persistDownloads(store: IStore, db: DB) {
  const state = store.getState();
  const { items, restored } = state.downloads;
  if (!restored) {
    // don't persist yet
  }
  const numItems = Object.keys(items).length;

  if (numItems > 0) {
    logger.debug(`Persisting ${numItems} downloads...`);

    db.saveMany({
      downloads: items,
    });
  }

  const numDbItems = db.downloads.count(k => k.where("1"));
  const extras = numDbItems - numItems;
  if (extras > 0) {
    logger.debug(`Purging ${extras} items from DB`);
    db.downloads.delete(k => k.where("id not in ?", Object.keys(items)));
  }
}

function restoreDownloads(store: IStore, db: DB) {
  let numRestored = 0;

  try {
    const items = db.downloads.all(k => k.where("1"));
    numRestored = items.length;
    const [finished, nonFinished] = _.partition(items, x => x.finished);

    const sendAll = (items: IDownloadItem[]) => {
      for (const item of _.sortBy(items, "rank")) {
        store.dispatch(actions.downloadStarted(item));
      }
    };

    sendAll(nonFinished);
    sendAll(finished);
  } finally {
    logger.info(`Restored ${numRestored} downloads`);
    store.dispatch(actions.downloadsRestored({}));
  }
}

export async function cleanDownloadsSearch(store: IStore) {
  throw new Error("re-implement me in buse please!");

  // const ctx = new MinimalContext();
  // const instance = await makeButlerInstance();

  // const { preferences, downloads } = store.getState();
  // const { items } = downloads;

  // // staging folders' names are just the UUID of a download
  // const whitelist = Object.keys(items);

  // let installLocations = [
  //   "appdata",
  //   ...Object.keys(preferences.installLocations),
  // ];

  // const roots = [];
  // for (const loc of installLocations) {
  //   const folder = downloadBasePath(loc, preferences);
  //   roots.push(folder);
  // }

  // instance.onClient(async client => {
  //   try {
  //     setupClient(client, logger, ctx);

  //     const res = await client.call(
  //       messages.CleanDownloadsSearch({ roots, whitelist })
  //     );

  //     if (res.entries && res.entries.length > 0) {
  //       let totalSize = 0;
  //       for (const entry of res.entries) {
  //         totalSize += entry.size;
  //       }

  //       logger.info(
  //         `${res.entries.length} folders can be cleaned, ${fileSize(
  //           totalSize
  //         )} total`
  //       );
  //       store.dispatch(
  //         actions.cleanDownloadsFoundEntries({ entries: res.entries })
  //       );
  //     }
  //   } catch (e) {
  //     logger.error(`While searching for downloads to clean: ${e.stack}`);
  //   } finally {
  //     instance.cancel();
  //   }
  // });

  // await instance.promise();
}

export async function cleanDownloadsApply(
  store: IStore,
  payload: typeof actions.cleanDownloadsApply.payload
) {
  throw new Error("re-implement me in buse please!");

  // const { entries } = payload;
  // const ctx = new MinimalContext();
  // const instance = await makeButlerInstance();

  // instance.onClient(async client => {
  //   try {
  //     setupClient(client, logger, ctx);

  //     await client.call(messages.CleanDownloadsApply({ entries }));
  //   } catch (e) {
  //     logger.error(`While cleaning downloads: ${e.stack}`);
  //   } finally {
  //     instance.cancel();
  //   }
  // });

  // await instance.promise();
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.boot, async (store, action) => {
    try {
      restoreDownloads(store, db);
    } catch (e) {
      logger.error(`While restoring downloads: ${e.stack || e}`);
    }
  });

  watcher.on(actions.tick, async (store, action) => {
    try {
      persistDownloads(store, db);
    } catch (e) {
      logger.error(`While persisting downloads: ${e.stack || e}`);
    }
  });

  watcher.on(actions.cleanDownloadsSearch, async (store, action) => {
    try {
      await cleanDownloadsSearch(store);
    } catch (e) {
      logger.error(
        `While searching for download folders to clean: ${e.stack || e}`
      );
    }
  });

  watcher.on(actions.cleanDownloadsApply, async (store, action) => {
    try {
      await cleanDownloadsApply(store, action.payload);
    } catch (e) {
      logger.error(`While cleaning download folders: ${e.stack || e}`);
    }
  });

  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.setup.done,
        (rs: IRootState) => rs.downloads.restored,
        (setupDone, downloadsRestored) => {
          if (setupDone && downloadsRestored) {
            schedule.dispatch(actions.cleanDownloadsSearch({}));
          }
        }
      ),
  });
}
