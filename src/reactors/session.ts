import { Watcher } from "./watcher";

import { actions } from "../actions";
import { getActiveDownload } from "./downloads/getters";

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const me = store.getState().session.credentials.me;
    if (me.developer) {
      store.dispatch(actions.unlockTab({ tab: "dashboard" }));
    }

    store.dispatch(actions.switchPage({ page: "hub" }));

    // resume downloads
    store.dispatch(actions.resumeDownloads({}));

    // and open downloads tab if we have some pending
    const { downloads } = store.getState();
    if (getActiveDownload(downloads)) {
      store.dispatch(actions.navigate({ tab: "downloads", background: true }));
    }
  });

  watcher.on(actions.logout, async (store, action) => {
    store.dispatch(actions.switchPage({ page: "gate" }));
    store.dispatch(actions.pauseDownloads({}));
  });
}
