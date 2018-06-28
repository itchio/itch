import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { t } from "common/format/t";
import { ItchPromise } from "common/util/itch-promise";
import { urlForInstallLocation } from "common/util/navigation";
import { Watcher } from "common/util/watcher";
import { dialog } from "electron";
import { mcall } from "main/butlerd/mcall";
import * as explorer from "main/os/explorer";
import { promisedModal } from "main/reactors/modals";
import { getNativeWindow } from "main/reactors/winds";
import { modals } from "common/modals";

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

    const { installLocation } = await mcall(messages.InstallLocationsGetByID, {
      id,
    });
    if (!installLocation) {
      return;
    }

    if (installLocation.sizeInfo!.installedSize > 0) {
      store.dispatch(
        actions.openModal(
          modals.naked.make({
            wind: "root",
            title: ["prompt.install_location_not_empty.title"],
            message: ["prompt.install_location_not_empty.message"],
            detail: ["prompt.install_location_not_empty.detail"],
            buttons: [
              {
                label: ["prompt.install_location_not_empty.show_contents"],
                action: actions.navigate({
                  wind: "root",
                  url: urlForInstallLocation(installLocation.id),
                }),
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
        modals.naked.make({
          wind: "root",
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

      await mcall(messages.InstallLocationsRemove, { id });
      store.dispatch(actions.installLocationsChanged({}));
    }
  });

  watcher.on(actions.addInstallLocation, async (store, action) => {
    const { wind } = action.payload;
    const i18n = store.getState().i18n;
    const nativeWindow = getNativeWindow(store.getState(), wind);
    if (!nativeWindow) {
      return;
    }

    const dialogOpts = {
      title: t(i18n, ["prompt.install_location_add.title"]),
      // crazy typescript workaround, avert your eyes
      properties: ["openDirectory", "createDirectory"] as (
        | "openDirectory"
        | "createDirectory")[],
    };

    const promise = new ItchPromise<string>((resolve, reject) => {
      const callback = (response: string[]) => {
        if (!response) {
          return resolve();
        }

        return resolve(response[0]);
      };
      dialog.showOpenDialog(nativeWindow, dialogOpts, callback);
    });

    const path = await promise;
    if (path) {
      await mcall(messages.InstallLocationsAdd, { path });
      store.dispatch(actions.installLocationsChanged({}));
    }
  });

  watcher.on(actions.browseInstallLocation, async (store, action) => {
    const { id } = action.payload;
    const { installLocation } = await mcall(messages.InstallLocationsGetByID, {
      id,
    });
    if (installLocation) {
      explorer.open(installLocation.path);
    }
  });
}
