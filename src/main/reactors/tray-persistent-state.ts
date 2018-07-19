import { Store, Action } from "common/types";
import { Tray, nativeImage } from "electron";
import { getImagePath } from "common/util/resources";
import env from "common/env";
import { actions } from "common/actions";
import { release } from "os";
import { mainLogger } from "main/logger";

let tray: Electron.Tray;

// used to glue balloon click with notification callbacks
let lastNotificationAction: Action<any>;

export function getTray(store: Store): Electron.Tray {
  if (!tray) {
    const iconPath = getImagePath(`tray/${env.appName}.png`);
    mainLogger.info(`Using tray image (${iconPath})`);
    let iconImage = nativeImage.createFromPath(iconPath);
    let onKDE = process.env.XDG_CURRENT_DESKTOP === "KDE";

    if (process.platform === "win32") {
      // cf. https://github.com/itchio/itch/issues/462
      // windows still displays a 16x16, whereas
      // some linux DEs don't know what to do with a @x2, etc.
      iconImage = iconImage.resize({
        width: 16,
        height: 16,
      });
    } else if (onKDE) {
      // KDE can't handle a 256x256 png apparently
      iconImage = iconImage.resize({
        width: 24,
        height: 24,
      });
    }

    tray = new Tray(iconImage);
    tray.setToolTip(env.appName);
    tray.on("click", () => {
      store.dispatch(actions.focusWind({ wind: "root", toggle: true }));
    });
    tray.on("double-click", () => {
      store.dispatch(actions.focusWind({ wind: "root" }));
    });
    tray.on("balloon-click", () => {
      if (lastNotificationAction) {
        store.dispatch(lastNotificationAction);
      }
    });
  }
  return tray;
}

export function rememberNotificationAction(action: Action<any>) {
  lastNotificationAction = action;
}
