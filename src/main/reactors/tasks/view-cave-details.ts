import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import modals from "main/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await mcall(messages.FetchCave, { caveId });

    store.dispatch(
      actions.openModal(
        modals.exploreJson.make({
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
