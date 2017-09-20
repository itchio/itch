import { Watcher } from "../watcher";
import * as actions from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.abortGameRequest, async (store, action) => {
    const { game } = action.payload;

    store.dispatch(
      actions.openModal({
        title: ["prompt.abort_game.title"],
        message: ["prompt.abort_game.message", { title: game.title }],
        buttons: [
          {
            label: ["prompt.action.force_close"],
            id: "modal-force-close",
            action: actions.abortGame({ gameId: game.id }),
            icon: "cross",
          },
          "cancel",
        ],
      })
    );
  });
}
