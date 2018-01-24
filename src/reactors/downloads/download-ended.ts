import { Watcher } from "../watcher";
import * as actions from "../../actions";
import { t } from "../../format";

export default function(watcher: Watcher) {
  watcher.on(actions.downloadEnded, async (store, action) => {
    const { err, item } = action.payload;
    if (err) {
      // don't show notifications for these
      return;
    }

    const prefs = store.getState().preferences || { readyNotification: true };
    const { readyNotification } = prefs;

    if (readyNotification) {
      let notificationMessage: string = null;
      let notificationOptions: any = {
        title: item.game.title,
      };
      switch (item.reason) {
        case "install":
          notificationMessage = "notification.download_installed";
          break;
        case "update":
          notificationMessage = "notification.download_updated";
          break;
        case "revert":
          notificationMessage = "notification.download_reverted";
          notificationOptions.version = `?`;
          const { build } = item;
          if (build) {
            notificationOptions.version = `#${build.userVersion ||
              build.version}`;
          }
          break;
        case "heal":
          notificationMessage = "notification.download_healed";
          break;
        default:
        // make the typescript compiler happy
      }

      if (notificationMessage) {
        const { i18n } = store.getState();
        const message = t(i18n, [notificationMessage, notificationOptions]);
        store.dispatch(
          actions.notify({
            body: message,
            onClick: actions.navigateToGame({ game: item.game }),
          })
        );
      }
    }
  });
}
