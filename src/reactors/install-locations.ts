import { Watcher } from "./watcher";

import explorer from "../os/explorer";
import { t } from "../format";

import { actions } from "../actions";

import { BrowserWindow, dialog } from "electron";

import { modalWidgets } from "../components/modal-widgets/index";
import { call, messages } from "../buse";
import { promisedModal } from "./modals";

export default function(watcher: Watcher) {
  watcher.on(actions.makeInstallLocationDefault, async (store, action) => {
    const { id } = action.payload;
    store.dispatch(
      actions.updatePreferences({
        defaultInstallLocation: id,
      })
    );
    store.dispatch(actions.installLocationsChanged({}));
  });

  watcher.on(actions.removeInstallLocation, async (store, action) => {
    const { id } = action.payload;

    const { installLocation } = await call(messages.InstallLocationsGetByID, {
      id,
    });
    if (!installLocation) {
      return;
    }

    if (installLocation.sizeInfo.installedSize > 0) {
      store.dispatch(
        actions.openModal(
          modalWidgets.naked.make({
            title: ["prompt.install_location_not_empty.title"],
            message: ["prompt.install_location_not_empty.message"],
            detail: ["prompt.install_location_not_empty.detail"],
            buttons: [
              {
                label: ["prompt.install_location_not_empty.show_contents"],
                action: actions.navigateToInstallLocation({ installLocation }),
              },
              "cancel",
            ],
            widgetParams: null,
          })
        )
      );
      return;
    }

    {
      const res = await promisedModal(
        store,
        modalWidgets.naked.make({
          title: ["prompt.install_location_remove.title"],
          message: ["prompt.install_location_remove.message"],
          detail: [
            "prompt.install_location_remove.detail",
            {
              location: installLocation.path,
            },
          ],
          buttons: [
            {
              label: ["prompt.action.confirm_removal"],
              action: actions.modalResponse({}),
            },
            "cancel",
          ],
          widgetParams: null,
        })
      );

      if (!res) {
        // modal was closed
        return;
      }

      await call(messages.InstallLocationsRemove, { id });
      store.dispatch(actions.installLocationsChanged({}));
    }
  });

  watcher.on(actions.addInstallLocation, async (store, action) => {
    const i18n = store.getState().i18n;
    const windowId = store.getState().ui.mainWindow.id;
    const window = BrowserWindow.fromId(windowId);

    if (!window) {
      return;
    }

    const dialogOpts = {
      title: t(i18n, ["prompt.install_location_add.title"]),
      // crazy typescript workaround, avert your eyes
      properties: ["openDirectory", "createDirectory"] as (
        | "openDirectory"
        | "createDirectory")[],
    };

    const promise = new Promise<typeof actions.addInstallLocation.payload>(
      (resolve, reject) => {
        const callback = (response: string[]) => {
          if (!response) {
            return resolve();
          }

          return resolve(response[0]);
        };
        dialog.showOpenDialog(window, dialogOpts, callback);
      }
    );

    const path = await promise;
    if (path) {
      await call(messages.InstallLocationsAdd, { path });
      store.dispatch(actions.installLocationsChanged({}));
    }
  });

  watcher.on(actions.browseInstallLocation, async (store, action) => {
    const { id } = action.payload;
    const { installLocation } = await call(messages.InstallLocationsGetByID, {
      id,
    });
    if (installLocation) {
      explorer.open(installLocation.path);
    }
  });
}
