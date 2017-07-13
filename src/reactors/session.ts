import { Watcher } from "./watcher";

import * as actions from "../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const me = store.getState().session.credentials.me;
    if (me.developer) {
      store.dispatch(actions.unlockTab({ path: "dashboard" }));
    }

    store.dispatch(actions.switchPage({ page: "hub" }));
  });

  watcher.on(actions.logout, async (store, action) => {
    store.dispatch(actions.switchPage({ page: "gate" }));
  });
}
