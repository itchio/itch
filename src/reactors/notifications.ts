import * as ospath from "path";

import { Watcher } from "./watcher";

import { getTray } from "./tray";
import { app, BrowserWindow } from "electron";
import * as os from "../os";

import * as actions from "../actions";
import env from "../env";

import delay from "./delay";

const AUTODISMISS_DELAY = 5000;

// OSX already shows the app's icon
const DEFAULT_ICON =
  os.platform() === "darwin" ? null : `./static/images/tray/${env.appName}.png`;

export default function(watcher: Watcher) {
  watcher.on(actions.bounce, async (store, action) => {
    const { dock } = app;
    if (dock) {
      dock.bounce();
    }
  });

  watcher.on(actions.notify, async (store, action) => {
    const {
      title = "itch",
      body,
      icon = DEFAULT_ICON,
      onClick,
    } = action.payload;

    if (os.platform() === "win32" && !/^10\./.test(os.release())) {
      const tray = getTray();
      if (tray) {
        // The HTML5 notification API has caveats on Windows earlier than 10
        tray.displayBalloon({
          title,
          // this particular API requires absolute paths for some reason
          icon: Electron.NativeImage.createFromPath(
            ospath.join(__dirname, icon)
          ),
          content: body,
        });
      }
    } else {
      const id = store.getState().ui.mainWindow.id;
      const window = BrowserWindow.fromId(id);
      if (
        window &&
        !window.isDestroyed() &&
        !window.webContents.isDestroyed()
      ) {
        const opts = { body, icon };
        store.dispatch(actions.notifyHtml5({ title, opts, onClick }));
      }
    }
  });

  watcher.on(actions.statusMessage, async (store, action) => {
    await delay(AUTODISMISS_DELAY);
    store.dispatch(actions.dismissStatusMessage({}));
  });
}
