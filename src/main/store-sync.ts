// Vendored from @goosewobbler/electron-redux (syncMain). Changes from
// the original:
// - plain middleware in the store's own chain instead of a store
//   enhancer, so incoming actions pass through the full chain
//   (including the route middleware)
// - broadcasts only to webContents that fetched the initial state (app
//   windows), not getAllWebContents()
// - broadcasts after the reduce, with isDestroyed/try-catch guards, so
//   a failing send can't drop the action locally
// - inbound actions are validated before dispatch, mirroring the
//   outbound path
// - plain JSON serialization (upstream's Map/Set support had no
//   consumers here)

import { ipcMain, WebContents } from "electron";
import { AnyAction, Middleware } from "redux";
import { mainLogger } from "main/logger";
import {
  ACTION_CHANNEL,
  FETCH_STATE_CHANNEL,
  stopForwarding,
  validateAction,
} from "common/util/store-sync";

const logger = mainLogger.child(__filename);

// Actions are only broadcast to webContents that fetched the initial
// state, i.e. app windows running our renderer.
const appWebContents = new Set<WebContents>();

const register = (contents: WebContents) => {
  if (appWebContents.has(contents)) {
    return;
  }
  appWebContents.add(contents);
  contents.once("destroyed", () => {
    appWebContents.delete(contents);
  });
};

const broadcast = (action: AnyAction, excludeId?: number) => {
  for (const contents of appWebContents) {
    // destroyed check first: any other member access throws once the
    // native object is gone
    if (contents.isDestroyed()) {
      continue;
    }
    const id = contents.id;
    if (id === excludeId) {
      continue;
    }
    try {
      contents.send(ACTION_CHANNEL, action);
    } catch (e) {
      logger.debug(
        `Could not forward ${action.type} to webContents ${id}: ${e}`
      );
    }
  }
};

export const mainSyncMiddleware: Middleware = (api) => {
  ipcMain.handle(FETCH_STATE_CHANNEL, (event) => {
    register(event.sender);
    return JSON.stringify(api.getState());
  });

  ipcMain.on(ACTION_CHANNEL, (event, action) => {
    if (!validateAction(action)) {
      return;
    }
    // before the dispatch: the sender can be destroyed during it
    const senderId = event.sender.id;
    const localAction = stopForwarding(action);
    api.dispatch(localAction);
    // Forward it to all of the other renderers
    broadcast(localAction, senderId);
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
