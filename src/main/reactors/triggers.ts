import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

export default function(watcher: Watcher) {
  watcher.on(actions.commandBack, async (store, action) => {
    const { window } = action.payload;
    const modals = store.getState().windows[window].modals;
    const [modal] = modals;

    if (modal) {
      store.dispatch(actions.closeModal({ window }));
    }
  });
}
