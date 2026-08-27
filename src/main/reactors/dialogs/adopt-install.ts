import { actions } from "common/actions";
import modals from "main/modals";
import { Watcher } from "common/util/watcher";

export default function (watcher: Watcher) {
  watcher.on(actions.adoptGameInstall, async (store, action) => {
    const { game, uploadId } = action.payload;

    // opened from the install dialog's thumbnail: close that dialog so
    // a successful adoption doesn't reveal it again with a stale error.
    // closed by id because closeModal resolves "frontmost" in an async
    // watcher, which would race with the openModal below
    const frontmost = store.getState().winds["root"]?.modals[0];
    if (frontmost) {
      store.dispatch(actions.closeModal({ wind: "root", id: frontmost.id }));
    }

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
