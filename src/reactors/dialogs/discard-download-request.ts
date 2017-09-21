import { Watcher } from "../watcher";
import * as actions from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.discardDownloadRequest, async (store, action) => {
    const { id } = action.payload;
    const item = store.getState().downloads.items[id];
    if (!item) {
      // can't cancel if we don't know about it!
      return;
    }

    const confirmAction = actions.discardDownload({ id });

    if (item.finished || !item.progress) {
      // finished or not started yet, let's just go ahead
      store.dispatch(confirmAction);
      return;
    }

    const { game } = item;

    store.dispatch(
      actions.openModal({
        title: "",
        message: ["prompt.discard_download.message", { title: game.title }],
        detail: ["prompt.discard_download.detail"],
        buttons: [
          {
            label: ["prompt.discard_download.action"],
            id: "modal-discard-download",
            action: confirmAction,
            icon: "delete",
          },
          "nevermind",
        ],
      })
    );
  });
}
