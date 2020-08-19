import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";
import { modals } from "common/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.changeUser, async (store, action) => {
    store.dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
          title: ["prompt.logout_title"],
          message: ["prompt.logout_confirm"],
          detail: ["prompt.logout_detail"],
          buttons: [
            {
              id: "modal-logout",
              label: ["prompt.logout_action"],
              action: actions.requestLogout({}),
              icon: "exit",
            },
            "cancel",
          ],
          widgetParams: null,
        })
      )
    );
  });
}
