import { Watcher } from "../watcher";
import { actions } from "../../actions";
import { modalWidgets } from "../../components/modal-widgets";
import { call, messages } from "../../buse";

import { promisedModal } from "../modals";
import { IScanInstallLocationsParams } from "../../components/modal-widgets/scan-install-locations";

export default function(watcher: Watcher) {
  watcher.on(actions.scanInstallLocations, async (store, action) => {
    let names: string[] = [];
    let widgetParams: IScanInstallLocationsParams = {
      progress: 0.00001,
      game: null,
    };

    const openModal = actions.openModal(
      modalWidgets.scanInstallLocations.make({
        title: "Scanning...",
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
      const importRes = await call(
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
                  title: "Confirm import",
                  message: "The following items can be imported:",
                  detail: names.map(n => `  * ${n}`).join("\n") + "\n",
                  widgetParams: null,
                  buttons: [
                    {
                      label: `Import ${params.numItems} items`,
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
            message: "No additional items founds in install locations",
          })
        );
      } else if (importRes.numImportedItems > 0) {
        store.dispatch(actions.newItemsImported({}));
        store.dispatch(
          actions.statusMessage({
            message: `${
              importRes.numImportedItems
            } items were successfully imported`,
          })
        );
      }
    } finally {
      store.dispatch(actions.closeModal({ id: modalId }));
    }
  });
}
