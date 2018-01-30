import { Watcher } from "../watcher";

import { actions } from "../../actions";
import { promisedModal } from "../modals";

import { modalWidgets } from "../../components/modal-widgets/index";

export default function(watcher: Watcher) {
  watcher.on(actions.clearBrowsingDataRequest, async (store, action) => {
    const response = await promisedModal(
      store,
      modalWidgets.clearBrowsingData.make({
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
