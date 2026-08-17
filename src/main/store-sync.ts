// Vendored from @goosewobbler/electron-redux (syncMain), as plain middleware
// instead of a store enhancer.

import { ipcMain, webContents } from "electron";
import { AnyAction, Middleware } from "redux";
import { mainLogger } from "main/logger";
import {
  ACTION_CHANNEL,
  FETCH_STATE_CHANNEL,
  stopForwarding,
  validateAction,
} from "common/util/store-sync";

const logger = mainLogger.child(__filename);

const broadcast = (action: AnyAction, excludeId?: number) => {
  for (const contents of webContents.getAllWebContents()) {
    if (contents.id === excludeId || contents.isDestroyed()) {
      continue;
    }
    try {
      contents.send(ACTION_CHANNEL, action);
    } catch (e) {
      logger.debug(
        `Could not forward ${action.type} to webContents ${contents.id}: ${e}`
      );
    }
  }
};

export const mainSyncMiddleware: Middleware = (api) => {
  ipcMain.handle(FETCH_STATE_CHANNEL, () => JSON.stringify(api.getState()));

  ipcMain.on(ACTION_CHANNEL, (event, action) => {
    if (!validateAction(action)) {
      return;
    }
    const localAction = stopForwarding(action);
    api.dispatch(localAction);
    // Forward it to all of the other renderers
    broadcast(localAction, event.sender.id);
  });

  return (next) => (action) => {
    // reduce first: a throwing send must not keep the action from
    // being applied locally
    const res = next(action);
    if (validateAction(action)) {
      broadcast(action);
    }
    return res;
  };
};
