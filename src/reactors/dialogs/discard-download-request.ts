import { Watcher } from "../watcher";
import * as actions from "../../actions";
import isHeal from "../downloads/is-heal";

export default function(watcher: Watcher) {
  watcher.on(actions.discardDownloadRequest, async (store, action) => {
    const { id } = action.payload;
    const item = store.getState().downloads.items[id];
    if (!item) {
      // can't cancel if we don't know about it!
      return;
    }

    const confirmAction = actions.discardDownload({ id });

    if (isHeal(item)) {
      store.dispatch(
        actions.openModal({
          title: [
            `download.ongoing.${item.reason}`,
            { title: item.game.title },
          ],
          message: [
            "prompt.dangerous_discard_download.message",
            { title: item.game.title },
          ],
          detail: [
            "prompt.dangerous_discard_download.detail",
            { title: item.game.title },
          ],
          buttons: [
            {
              label: ["prompt.discard_download.action.stop_download"],
              action: confirmAction,
            },
            {
              label: ["prompt.discard_download.action.continue_download"],
              action: actions.closeModal({}),
              className: "secondary",
            },
          ],
        })
      );
      return;
    }

    if (item.finished || !item.progress) {
      // finished or not started yet, let's just go ahead
      store.dispatch(confirmAction);
      return;
    }

    const { game } = item;

    store.dispatch(
      actions.openModal({
        title: [`download.ongoing.${item.reason}`, { title: item.game.title }],
        message: ["prompt.discard_download.message", { title: game.title }],
        detail: ["prompt.discard_download.detail", { title: game.title }],
        buttons: [
          {
            label: ["prompt.discard_download.action.stop_download"],
            id: "modal-discard-download",
            action: confirmAction,
          },
          {
            label: ["prompt.discard_download.action.continue_download"],
            action: actions.closeModal({}),
            className: "secondary",
          },
        ],
      })
    );
  });
}
