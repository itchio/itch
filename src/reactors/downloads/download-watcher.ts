
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import delay from "../delay";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "download-watcher"});

import {EventEmitter} from "events";
import {throttle} from "underscore";
import {BrowserWindow} from "electron";

import {Cancelled} from "../../tasks/errors";
import downloadTask from "../../tasks/download";

import {
  IStore,
  IDownloadItem,
} from "../../types";

import {IProgressInfo} from "../../types";

const DOWNLOAD_DELAY = 250;

let currentDownload: IDownloadItem = null;
let currentEmitter: EventEmitter = null;

async function updateDownloadState (store: IStore) {
  await delay(DOWNLOAD_DELAY);

  const downloadsState = store.getState().downloads;
  if (downloadsState.downloadsPaused) {
    if (currentDownload) {
      cancelCurrent();
    }
    await setProgress(store, -1);
    return;
  }

  const activeDownload = downloadsState.activeDownload;
  if (activeDownload) {
    if (!currentDownload || currentDownload.id !== activeDownload.id) {
      logger.info(`${activeDownload.id} is the new active download`);
      start(store, activeDownload);
    } else {
      // still downloading currentDownload
    }
  } else {
    if (currentDownload) {
      logger.info("Cancelling/clearing out last download");
      cancelCurrent();
    } else {
      // idle
    }
  }
  await setProgress(store, downloadsState.activeItemProgress);
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

async function start (store: IStore, download: IDownloadItem) {
  cancelCurrent();
  currentDownload = download;
  currentEmitter = new EventEmitter();

  let error: Error;
  let cancelled = false;
  try {
    currentEmitter.on("progress", throttle((ev: IProgressInfo) => {
      if (cancelled) {
        return;
      }
      store.dispatch(actions.downloadProgress({id: download.id, ...ev}));
    }, 250));

    logger.info("Starting download...");
    await downloadTask(currentEmitter, extendedOpts);
  } catch (e) {
    logger.error("Download threw");
    error = e;
  } finally {
    if (error instanceof Cancelled) {
      // all good, but not ended
      cancelled = true;
      logger.info("Download cancelled");
    } else {
      const err = error ? error.message || ("" + error) : null;
      logger.info(`Download ended, err: ${err || "<none>"}`);

      const item = store.getState().downloads.items[download.id];
      store.dispatch(actions.downloadEnded({id: download.id, err, item}));
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
