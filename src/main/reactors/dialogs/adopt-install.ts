import { actions } from "common/actions";
import modals from "main/modals";
import { Watcher } from "common/util/watcher";

export default function (watcher: Watcher) {
  watcher.on(actions.adoptGameInstall, async (store, action) => {
    const { game, uploadId } = action.payload;

    store.dispatch(
      actions.openModal(
        modals.adoptInstall.make({
          wind: "root",
          title: game.title,
          widgetParams: {
            game,
            uploadId,
          },
          buttons: [],
        })
      )
    );
  });
}
