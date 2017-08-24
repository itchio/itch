import { Watcher } from "../watcher";

import * as actions from "../../actions";
import { MODAL_RESPONSE } from "../../constants/action-types";
import { promisedModal } from "../modals";

import { IClearBrowsingDataParams } from "../../components/modal-widgets/clear-browsing-data";

export default function(watcher: Watcher) {
  watcher.on(actions.clearBrowsingDataRequest, async (store, action) => {
    const response = await promisedModal(store, {
      title: ["preferences.advanced.clear_browsing_data"],
      message: "",
      widget: "clear-browsing-data",
      widgetParams: {} as IClearBrowsingDataParams,
      buttons: [
        {
          label: ["prompt.clear_browsing_data.clear"],
          id: "modal-clear-data",
          action: actions.modalResponse({}),
          actionSource: "widget",
        },
        "cancel",
      ],
    });

    if (response.type !== MODAL_RESPONSE) {
      // modal was closed
      return;
    }

    store.dispatch(
      actions.clearBrowsingData({
        cache: response.payload.cache,
        cookies: response.payload.cookies,
      })
    );
  });
}
