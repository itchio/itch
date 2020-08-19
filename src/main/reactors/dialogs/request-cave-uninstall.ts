import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { modals } from "common/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.requestCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await mcall(messages.FetchCave, { caveId });
    const { game } = cave;

    // FIXME: i18n - plus, that's generally bad
    const title = game ? game.title : "this";

    store.dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
          title: "",
          message: ["prompt.uninstall.message", { title }],
          buttons: [
            {
              label: ["prompt.uninstall.reinstall"],
              id: "modal-reinstall",
              action: actions.queueCaveReinstall({ caveId }),
              icon: "repeat",
            },
            {
              label: ["prompt.uninstall.uninstall"],
              id: "modal-uninstall",
              action: actions.queueCaveUninstall({ caveId }),
              icon: "uninstall",
            },
            "cancel",
          ],
          widgetParams: null,
        })
      )
    );
  });
}
