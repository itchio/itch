import { Watcher } from "common/util/watcher";

import { clipboard } from "electron";

import { actions } from "common/actions";

export default function (watcher: Watcher) {
  watcher.on(actions.copyToClipboard, async (store, action) => {
    const text: string = action.payload.text;
    clipboard.writeText(text);
    store.dispatch(
      actions.statusMessage({
        message: ["status.copied_to_clipboard"],
      })
    );
  });
}
