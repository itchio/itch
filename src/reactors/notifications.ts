import { Watcher } from "./watcher";

import { app, Notification, nativeImage } from "electron";
import * as os from "../os";

import * as actions from "../actions";
import env from "../env";

import delay from "./delay";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "notifications" });

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

    if (Notification.isSupported()) {
      const n = new Notification({
        title,
        subtitle: null,
        body,
        icon: icon ? nativeImage.createFromPath(icon) : null,
        actions: null,
      });
      if (onClick) {
        n.on("click", e => {
          store.dispatch(actions.focusWindow({}));
          store.dispatch(onClick);
        });
      }
      n.show();
    } else {
      logger.warn(`Cannot show notification: ${body}`);
    }
  });

  watcher.on(actions.statusMessage, async (store, action) => {
    await delay(AUTODISMISS_DELAY);
    store.dispatch(actions.dismissStatusMessage({}));
  });
}
