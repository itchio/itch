import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { modalWidgets } from "renderer/modal-widgets";
import { ScanInstallLocationsParams } from "renderer/modal-widgets/ScanInstallLocations";
import { promisedModal } from "../modals";
import { mcall } from "main/butlerd/mcall";

export default function(watcher: Watcher) {
  watcher.on(actions.scanInstallLocations, async (store, action) => {
    let names: string[] = [];
    let widgetParams: ScanInstallLocationsParams = {
      progress: 0.00001,
      game: null,
    };

    const openModal = actions.openModal(
      modalWidgets.scanInstallLocations.make({
        wind: "root",
        title: ["preferences.scan_install_locations.title"],
        message: "",
        buttons: [
          {
            label: ["prompt.action.close"],
            className: "secondary",
          },
        ],
        widgetParams,
        unclosable: true,
      })
    );
    store.dispatch(openModal);
    const modalId = openModal.payload.id;

    const update = () => {
      store.dispatch(
        actions.updateModalWidgetParams(
          modalWidgets.scanInstallLocations.update({
            id: modalId,
            widgetParams,
          })
        )
      );
    };

    try {
      const importRes = await mcall(
        messages.InstallLocationsScan,
        {},
        client => {
          client.onNotification(messages.Progress, async ({ params }) => {
            // TODO: relay ETA too?
            widgetParams.progress = params.progress;
            update();
          });

          client.onNotification(
            messages.InstallLocationsScanYield,
            async ({ params }) => {
              names.push(params.game.title);
              widgetParams.game = params.game;
              update();
            }
          );

          client.onRequest(
            messages.InstallLocationsScanConfirmImport,
            async ({ params }) => {
              const res = await promisedModal(
                store,
                modalWidgets.naked.make({
                  wind: "root",
                  title: ["preferences.scan_install_locations.confirm_import"],
                  message: ["preferences.scan_install_locations.message"],
                  detail: names.map(n => `  * ${n}`).join("\n") + "\n",
                  widgetParams: null,
                  buttons: [
                    {
                      label: [
                        "preferences.scan_install_locations.import_items",
                        { numItems: params.numItems },
                      ],
                      icon: "install",
                      action: actions.modalResponse({}),
                    },
                    "cancel",
                  ],
                })
              );
              return { confirm: !!res };
            }
          );
        }
      );

      if (importRes.numFoundItems == 0) {
        store.dispatch(
          actions.statusMessage({
            message: ["preferences.scan_install_locations.no_items_found"],
          })
        );
      } else if (importRes.numImportedItems > 0) {
        store.dispatch(actions.newItemsImported({}));
        store.dispatch(
          actions.statusMessage({
            message: [
              "preferences.scan_install_locations.items_imported",
              { numImportedItems: importRes.numImportedItems },
            ],
          })
        );
      }
    } finally {
      store.dispatch(actions.closeModal({ wind: "root", id: modalId }));
    }
  });
}
