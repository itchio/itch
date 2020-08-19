import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";
import { modals } from "common/modals";

export default function (watcher: Watcher) {
  watcher.on(actions.forceCloseGameRequest, async (store, action) => {
    const { game } = action.payload;

    store.dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
          title: ["prompt.force_close_game.title"],
          message: ["prompt.force_close_game.message", { title: game.title }],
          buttons: [
            {
              label: ["prompt.action.force_close"],
              id: "modal-force-close",
              action: actions.forceCloseGame({ gameId: game.id }),
              icon: "stop",
            },
            "nevermind",
          ],
          widgetParams: null,
        })
      )
    );
  });
}
