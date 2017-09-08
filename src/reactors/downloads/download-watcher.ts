import { Watcher } from "../watcher";
import * as actions from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-watcher" });

import { throttle } from "underscore";
import { BrowserWindow } from "electron";

import performDownload from "./perform-download";

import { getActiveDownload } from "./getters";

import Context from "../../context";
import { IStore, IDownloadItem, IDownloadResult } from "../../types";
import { IProgressInfo, isCancelled } from "../../types";

import { DB } from "../../db";
import s from "./download-watcher-state";

// TODO: pause downloads on logout.

async function updateDownloadState(store: IStore, db: DB) {
  const downloadsState = store.getState().downloads;
  if (downloadsState.paused) {
    if (s.currentDownload) {
      cancelCurrent();
    }
    await setProgress(store, -1);
    return;
  }

  const activeDownload = getActiveDownload(downloadsState);
  if (activeDownload) {
    await setProgress(store, activeDownload.progress || 0);
    if (!s.currentDownload || s.currentDownload.id !== activeDownload.id) {
      logger.info(`${activeDownload.id} is the new active download`);
      start(store, db, activeDownload);
    } else {
      // still downloading currentDownload
    }
  } else {
    await setProgress(store, -1);
    if (s.currentDownload) {
      logger.info("Cancelling/clearing out last download");
      cancelCurrent();
    } else {
      // idle
    }
  }
}

async function setProgress(store: IStore, alpha: number) {
  const id = store.getState().ui.mainWindow.id;
  if (id) {
    const window = BrowserWindow.fromId(id);
    if (window) {
      window.setProgressBar(alpha);
    }
  }
}

function cancelCurrent() {
  if (!s.currentContext) {
    return;
  }

  s.currentContext.tryAbort().catch(e => {
    logger.warn(`Could not cancel current download: ${e.stack}`);
  });
  s.currentContext = null;
  s.currentDownload = null;
}

async function start(store: IStore, db: DB, item: IDownloadItem) {
  cancelCurrent();
  s.currentDownload = item;
  s.currentContext = new Context(store, db);

  let error: Error;
  let cancelled = false;
  let result: IDownloadResult;

  try {
    s.currentContext.on(
      "progress",
      throttle((ev: IProgressInfo) => {
        if (cancelled) {
          return;
        }
        store.dispatch(actions.downloadProgress({ id: item.id, ...ev }));
      }, 250)
    );

    logger.info("Starting download...");
    result = await performDownload(s.currentContext, item);
  } catch (e) {
    error = e;
  } finally {
    if (isCancelled(error)) {
      // no error to handle, but don't trigger downloadEnded either
      cancelled = true;
      logger.info(`Download cancelled for ${item.game.title}`);
    } else {
      logger.info(`Download for ${item.game.title} ended`);
      if (error) {
        logger.error(`Download for ${item.game.title} threw: ${error.stack}`);
      }
      const err = error ? error.message || "" + error : null;

      const freshItem = store.getState().downloads.items[item.id];
      store.dispatch(
        actions.downloadEnded({
          id: freshItem.id,
          item: freshItem,
          err,
          result,
        })
      );
    }
  }
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.tick, async (store, action) => {
    try {
      await updateDownloadState(store, db);
    } catch (e) {
      logger.error(`While updating download state: ${e.stack || e}`);
    }
  });
}
