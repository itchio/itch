import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

import { Space } from "common/helpers/space";

export default function(watcher: Watcher) {
  watcher.on(actions.commandMain, async (store, action) => {
    const { window } = action.payload;
    const { tab } = store.getState().windows[window].navigation;
    const sp = Space.fromStore(store, window, tab);

    if (sp.prefix === "games") {
      const game = sp.game();
      if (game) {
        // FIXME: queueGame doesn't always do the right thing.
        // it'll try installing even if there's no chance you'll be able
        // to download it (for example, if you need to purchase it first)
        store.dispatch(actions.queueGame({ game }));
      }
    }
  });

  watcher.on(actions.commandBack, async (store, action) => {
    const { window } = action.payload;
    const modals = store.getState().windows[window].modals;
    const [modal] = modals;

    if (modal) {
      store.dispatch(actions.closeModal({ window }));
    }
  });
}
