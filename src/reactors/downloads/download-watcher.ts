
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import delay from "../delay";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "download-watcher"});

import {EventEmitter} from "events";
import {throttle} from "underscore";
import {BrowserWindow} from "electron";

import {Cancelled} from "../../tasks/errors";
import performDownload from "./perform-download";

import {getActiveDownload} from "./getters";

import {
  IStore,
  IDownloadItem,
  IDownloadResult,
} from "../../types";

import {IProgressInfo} from "../../types";

const DOWNLOAD_WATCHER_INTERVAL = 1000;

let currentDownload: IDownloadItem = null;
let currentEmitter: EventEmitter = null;

// TODO: pause downloads on logout.

async function updateDownloadState (store: IStore) {
  await delay(DOWNLOAD_WATCHER_INTERVAL);

  const downloadsState = store.getState().downloads;
  if (downloadsState.paused) {
    if (currentDownload) {
      cancelCurrent();
    }
    await setProgress(store, -1);
    return;
  }

  const activeDownload = getActiveDownload(downloadsState);
  if (activeDownload) {
    await setProgress(store, activeDownload.progress || 0);
    if (!currentDownload || currentDownload.id !== activeDownload.id) {
      logger.info(`${activeDownload.id} is the new active download`);
      start(store, activeDownload);
    } else {
      // still downloading currentDownload
    }
  } else {
    await setProgress(store, -1);
    if (currentDownload) {
      logger.info("Cancelling/clearing out last download");
      cancelCurrent();
    } else {
      // idle
    }
  }
}

async function setProgress (store: IStore, alpha: number) {
  const id = store.getState().ui.mainWindow.id;
  if (id) {
    const window = BrowserWindow.fromId(id);
    if (window) {
      window.setProgressBar(alpha);
    }
  }
}

function cancelCurrent () {
  if (currentEmitter) {
    currentEmitter.emit("cancel");
  }
  currentEmitter = null;
  currentDownload = null;
}

async function start (store: IStore, item: IDownloadItem) {
  cancelCurrent();
  currentDownload = item;
  currentEmitter = new EventEmitter();

  let error: Error;
  let cancelled = false;
  let result: IDownloadResult;

  try {
    currentEmitter.on("progress", throttle((ev: IProgressInfo) => {
      if (cancelled) {
        return;
      }
      store.dispatch(actions.downloadProgress({id: item.id, ...ev}));
    }, 250));

    logger.info("Starting download...");
    result = await performDownload(store, item, currentEmitter);
  } catch (e) {
    error = e;
  } finally {
    if (error instanceof Cancelled) {
      // all good, but not ended
      cancelled = true;
      logger.info("Download cancelled");
    } else {
      logger.info(`Download ended`);
      if (error) {
        logger.error(`Download threw: ${error.stack}`);
      }
      const err = error ? error.message || ("" + error) : null;

      const freshItem = store.getState().downloads.items[item.id];
      store.dispatch(actions.downloadEnded({
        id: freshItem.id,
        item: freshItem,
        err,
        result,
      }));
    }
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    while (true) {
      try {
        await updateDownloadState(store);
      } catch (e) {
        logger.error(`While updating download state: ${e.stack || e}`);
      }
    }
  });
}
