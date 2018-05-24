import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";
import { manager } from "main/reactors/setup";
import { IStore } from "common/types";

// 2 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;
const UPDATE_INTERVAL_WIGGLE = 0.2 * 60 * 60 * 1000;

export default function(watcher: Watcher) {
  watcher.on(actions.tick, async (store, action) => {
    const rs = store.getState();
    const { nextComponentsUpdateCheck } = rs.systemTasks;

    let componentCheckPastDue = Date.now() > nextComponentsUpdateCheck;
    let setupDone = rs.setup.done;

    let shouldUpdateNow = setupDone && componentCheckPastDue;
    if (!shouldUpdateNow) {
      return;
    }

    rescheduleComponentsUpdate(store);
    store.dispatch(actions.checkForComponentUpdates({}));
  });

  watcher.on(actions.checkForComponentUpdates, async (store, action) => {
    rescheduleComponentsUpdate(store);
    await manager.upgrade();
  });

  watcher.on(actions.viewChangelog, async (store, action) => {
    // TODO: re-implement me
  });
}

function rescheduleComponentsUpdate(store: IStore) {
  const sleepTime = UPDATE_INTERVAL + Math.random() + UPDATE_INTERVAL_WIGGLE;
  store.dispatch(
    actions.scheduleSystemTask({
      nextComponentsUpdateCheck: Date.now() + sleepTime,
    })
  );
}
