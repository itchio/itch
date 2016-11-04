
import * as uuid from "node-uuid";

import {log, opts} from "./log";

import * as actions from "../../actions";

import {IStore, IStartDownloadOpts} from "../../types/db";

let orderSeed = 0;

import {IAction} from "../../constants/action-types";

export async function startDownload (store: IStore, downloadOpts: IStartDownloadOpts) {
  downloadOpts.order = orderSeed++;

  const downloadsState = store.getState().downloads;

  const existing = downloadsState.downloadsByGameId[downloadOpts.game.id];
  if (existing && !existing.finished) {
    log(opts, `Not starting another download for ${downloadOpts.game.title}`);
    store.dispatch(actions.navigate("downloads"));
    return;
  }

  const {upload, downloadKey} = downloadOpts;
  log(opts, `Should download ${upload.id}, has dl key ? ${!!downloadKey}`);

  const id = uuid.v4();
  // FIXME: wasteful but easy
  store.dispatch(actions.downloadStarted(Object.assign({}, downloadOpts, {id, downloadOpts})));
}

export async function queueDownload (store: IStore, action: IAction<IStartDownloadOpts>) {
  const downloadOpts = action.payload;
  await startDownload(store, downloadOpts);
}
