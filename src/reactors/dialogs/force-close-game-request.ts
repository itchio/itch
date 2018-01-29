import { Watcher } from "../watcher";
import { actions } from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.forceCloseGameRequest, async (store, action) => {
    const { game } = action.payload;

    store.dispatch(
      actions.openModal({
        title: ["prompt.force_close_game.title"],
        message: ["prompt.force_close_game.message", { title: game.title }],
        buttons: [
          {
            label: ["prompt.action.force_close"],
            id: "modal-force-close",
            action: actions.forceCloseGame({ gameId: game.id }),
            icon: "cross",
          },
          "nevermind",
        ],
      })
    );
  });
}
