import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";
import { t } from "common/format/t";
import { urlForGame } from "common/util/navigation";

export default function (watcher: Watcher) {
  watcher.on(actions.downloadEnded, async (store, action) => {
    const { download } = action.payload;
    if (download.error) {
      // don't show notifications for these
      return;
    }

    const prefs = store.getState().preferences || { readyNotification: true };
    const { readyNotification } = prefs;

    if (readyNotification) {
      let notificationMessage: string = null;
      let notificationOptions: any = {
        title: download.game.title,
      };

      switch (download.reason) {
        case "install":
          notificationMessage = "notification.download_installed";
          break;
        case "reinstall":
          notificationMessage = "notification.download_healed";
          break;
        case "update":
          notificationMessage = "notification.download_updated";
          break;
        case "version-switch":
          notificationMessage = "notification.download_reverted";
          notificationOptions.version = `?`;
          const { build } = download;
          if (build) {
            notificationOptions.version = `#${
              build.userVersion || build.version
            }`;
          }
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
            onClick: actions.navigate({
              wind: "root",
              url: urlForGame(download.game.id),
            }),
          })
        );
      }
    }
  });
}
