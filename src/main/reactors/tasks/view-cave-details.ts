import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "queue-cave-reinstall" });

import { withLogger, messages } from "common/butlerd";
import { modalWidgets } from "renderer/modal-widgets";
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await call(messages.FetchCave, { caveId });

    store.dispatch(
      actions.openModal(
        modalWidgets.exploreJson.make({
          wind: "root",
          title: `Cave details for ${cave.game ? cave.game.title : "?"}`,
          message: "Local cave data:",
          widgetParams: {
            data: cave,
          },
          buttons: [
            {
              label: ["prompt.action.ok"],
            },
          ],
        })
      )
    );
  });
}
