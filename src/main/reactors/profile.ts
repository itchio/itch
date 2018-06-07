import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";
import { getActiveDownload } from "./downloads/getters";

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    store.dispatch(actions.switchPage({ window: "root", page: "hub" }));

    // resume downloads
    store.dispatch(actions.setDownloadsPaused({ paused: false }));

    // and open downloads tab if we have some pending
    const { downloads } = store.getState();
    if (getActiveDownload(downloads)) {
      store.dispatch(
        actions.navigate({
          window: "root",
          url: "itch://downloads",
          background: true,
        })
      );
    }
  });

  watcher.on(actions.logout, async (store, action) => {
    store.dispatch(actions.switchPage({ window: "root", page: "gate" }));
    store.dispatch(actions.setDownloadsPaused({ paused: true }));
  });
}
