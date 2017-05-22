
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {find} from "underscore";

import logger from "../../logger";

import {IStore, IStartDownloadOpts} from "../../types";

let orderSeed = 0;

async function startDownload (store: IStore, downloadOpts: IStartDownloadOpts) {
  downloadOpts.order = orderSeed++;

  const downloadsState = store.getState().downloads;

  const existing = find(downloadsState.downloadsByGameId[downloadOpts.game.id], (d) => !d.finished);
  if (existing && !existing.finished) {
    logger.warn(`Not starting another download for ${downloadOpts.game.title}`);
    store.dispatch(actions.navigate("downloads"));
    return;
  }

  const {upload, downloadKey} = downloadOpts;
  logger.info(`Should download ${upload.id}, has dl key ? ${!!downloadKey}`);

  // FIXME: passing all downloadOpts here is wasteful (but easy)
  store.dispatch(actions.downloadStarted({...downloadOpts, downloadOpts}));
}

export default function (watcher: Watcher) {
  watcher.on(actions.queueDownload, async (store, action) => {
    const downloadOpts = action.payload;
    await startDownload(store, {
      ...downloadOpts,
      name: "download",
      gameId: downloadOpts.game.id,
    });
  });

  watcher.on(actions.retryDownload, async (store, action) => {
    startDownload(store, action.payload.downloadOpts);
  });
}
