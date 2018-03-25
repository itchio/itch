import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "request-cave-uninstall" });

import { modalWidgets } from "../../components/modal-widgets/index";
import { withLogger, messages } from "../../butlerd";
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
