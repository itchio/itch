import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

export default function (watcher: Watcher) {
  watcher.on(actions.commandBack, async (store, action) => {
    const { wind } = action.payload;
    const modals = store.getState().winds[wind].modals;
    const [modal] = modals;

    if (modal) {
      store.dispatch(actions.closeModal({ wind }));
    }
  });
}
