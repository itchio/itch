import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-persist" });

import { IStore } from "../../types/index";

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

export default function(watcher: Watcher) {
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
}
