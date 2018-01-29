import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-speed-watcher" });

import { IStore } from "../../types";

import { getActiveDownload } from "./getters";

const emptyObj: any = {};

async function updateDownloadSpeed(store: IStore) {
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
  watcher.on(actions.tick, async (store, action) => {
    try {
      await updateDownloadSpeed(store);
    } catch (e) {
      logger.error(`While updating download speed: ${e.stack || e}`);
    }
  });
}
