import { actions } from "common/actions";
import { messages, withLogger } from "common/butlerd";
import rootLogger from "common/logger";
import { Watcher } from "common/util/watcher";
import { modalWidgets } from "renderer/modal-widgets";

const logger = rootLogger.child({ name: "request-cave-uninstall" });

const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.requestCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await call(messages.FetchCave, { caveId });
    const { game } = cave;

    // FIXME: i18n - plus, that's generally bad
    const title = game ? game.title : "this";

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          wind: "root",
          title: "",
          message: ["prompt.uninstall.message", { title }],
          buttons: [
            {
              label: ["prompt.uninstall.uninstall"],
              id: "modal-uninstall",
              action: actions.queueCaveUninstall({ caveId }),
              icon: "uninstall",
            },
            {
              label: ["prompt.uninstall.reinstall"],
              id: "modal-reinstall",
              action: actions.queueCaveReinstall({ caveId }),
              icon: "repeat",
            },
            "cancel",
          ],
          widgetParams: null,
        })
      )
    );
  });
}
