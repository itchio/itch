
import {getTray} from "./tray";
import {app, BrowserWindow} from "../electron";
import os from "../util/os";

import * as actions from "../actions";

import delay from "./delay";

const AUTODISMISS_DELAY = 5000;

// OSX already shows the app's icon
const DEFAULT_ICON = os.platform() === "darwin" ? null : `./static/images/tray/${app.getName()}-64.png`;

import {IStore} from "../types"; 
import {IAction, IBouncePayload, INotifyPayload, IStatusMessagePayload} from "../constants/action-types"; 

async function bounce (store: IStore, action: IAction<IBouncePayload>) {
  const {dock} = app;
  if (dock) {
    dock.bounce();
  }
}

async function notify (store: IStore, action: IAction<INotifyPayload>) {
  const {title = "itch", body, icon = DEFAULT_ICON, onClick} = action.payload;

  if (os.platform() === "win32" && !/^10\./.test(os.release())) {
    const tray = getTray();
    if (tray) {
      // The HTML5 notification API has caveats on Windows earlier than 10
      tray.displayBalloon({title, icon, content: body});
    }
  } else {
    const id = store.getState().ui.mainWindow.id;
    const window = BrowserWindow.fromId(id);
    if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
      const opts = {body, icon};
      store.dispatch(actions.notifyHtml5({title, opts, onClick}));
    }
  }
}

async function statusMessage (store: IStore, action: IAction<IStatusMessagePayload>) {
  await delay(AUTODISMISS_DELAY);
  store.dispatch(actions.dismissStatusMessage({}));
}

export default {bounce, notify, statusMessage};
