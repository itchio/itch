// Vendored from @goosewobbler/electron-redux (syncMain), as plain middleware
// instead of a store enhancer.

import { ipcMain, webContents } from "electron";
import { Middleware } from "redux";
import {
  ACTION_CHANNEL,
  FETCH_STATE_CHANNEL,
  freeze,
  stopForwarding,
  validateAction,
} from "common/util/store-sync";

export const mainSyncMiddleware: Middleware = (api) => {
  ipcMain.handle(FETCH_STATE_CHANNEL, () =>
    // freeze preserves types like Map and Set that aren't JSON
    // serializable by default
    JSON.stringify(api.getState(), freeze)
  );

  ipcMain.on(ACTION_CHANNEL, (event, action) => {
    const localAction = stopForwarding(action);
    api.dispatch(localAction);
    // Forward it to all of the other renderers
    for (const contents of webContents.getAllWebContents()) {
      if (contents.id !== event.sender.id) {
        contents.send(ACTION_CHANNEL, localAction);
      }
    }
  });

  return (next) => (action) => {
    if (validateAction(action)) {
      for (const contents of webContents.getAllWebContents()) {
        contents.send(ACTION_CHANNEL, action);
      }
    }
    return next(action);
  };
};
