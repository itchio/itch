import { Watcher } from "../watcher";
import * as actions from "../../actions";

import delay from "../delay";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-speed-watcher" });

const DOWNLOAD_SPEED_DELAY = 1000;

import { IStore } from "../../types";

import { getActiveDownload } from "./getters";

const emptyObj: any = {};

async function updateDownloadSpeed(store: IStore) {
  await delay(DOWNLOAD_SPEED_DELAY);

  const { downloads } = store.getState();

  if (downloads.paused) {
    // don't update speeds while downloads are paused.
    return;
  }

  const activeDownload = getActiveDownload(downloads);

  const { bps = 0 } = activeDownload || emptyObj;
  store.dispatch(
    actions.downloadSpeedDatapoint({
      bps,
    })
  );
}

export default function(watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    while (true) {
      try {
        await updateDownloadSpeed(store);
      } catch (e) {
        logger.error(`While updating download speed: ${e.stack || e}`);
      }
    }
  });
}
