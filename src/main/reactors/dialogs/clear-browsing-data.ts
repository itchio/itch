import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";
import { promisedModal } from "main/reactors/modals";
import { modals } from "common/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.clearBrowsingDataRequest, async (store, action) => {
    const { wind } = action.payload;
    const response = await promisedModal(
      store,
      modals.clearBrowsingData.make({
        wind,
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
