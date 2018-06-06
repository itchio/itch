import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";
import { promisedModal } from "../modals";

import { modalWidgets } from "renderer/components/modal-widgets";

export default function(watcher: Watcher) {
  watcher.on(actions.clearBrowsingDataRequest, async (store, action) => {
    const response = await promisedModal(
      store,
      modalWidgets.clearBrowsingData.make({
        window: "root",
        title: ["preferences.advanced.clear_browsing_data"],
        message: "",
        buttons: [
          {
            label: ["prompt.clear_browsing_data.clear"],
            id: "modal-clear-data",
            action: "widgetResponse",
          },
          "cancel",
        ],
        widgetParams: {},
      })
    );

    if (!response) {
      // modal was closed
      return;
    }

    store.dispatch(
      actions.clearBrowsingData({
        cache: response.cache,
        cookies: response.cookies,
      })
    );
  });
}
