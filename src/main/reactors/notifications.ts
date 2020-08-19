import { actions } from "common/actions";
import env from "common/env";
import { t } from "common/format/t";
import { Watcher } from "common/util/watcher";
import { app, nativeImage, Notification } from "electron";
import { mainLogger } from "main/logger";
import { delay } from "main/reactors/delay";

const logger = mainLogger.child(__filename);

const AUTODISMISS_DELAY = 5000;

// OSX already shows the app's icon
const DEFAULT_ICON =
  process.platform === "darwin"
    ? null
    : `./static/images/tray/${env.appName}.png`;

export default function (watcher: Watcher) {
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
        n.on("click", (e) => {
          store.dispatch(actions.focusWind({ wind: "root" }));
          store.dispatch(onClick);
        });
      }
      n.show();
    } else {
      logger.warn(`Cannot show notification: ${body}`);
    }
  });

  watcher.on(actions.statusMessage, async (store, action) => {
    const { message } = action.payload;
    const { i18n } = store.getState();
    logger.info(`Status: ${t(i18n, message)}`);
    await delay(AUTODISMISS_DELAY);
    store.dispatch(actions.dismissStatusMessage({}));
  });
}
