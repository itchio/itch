import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

import { IStore } from "common/types";

async function applyTabOffset(store: IStore, offset: number) {
  const { tab, openTabs } = store.getState().profile.navigation;
  const { constant, transient } = openTabs;

  const allTabs = constant.concat(transient);
  const numTabs = allTabs.length;

  const index = allTabs.indexOf(tab);

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs;
  const newTab = allTabs[newIndex];

  store.dispatch(actions.focusTab({ tab: newTab }));
}

export default function(watcher: Watcher) {
  watcher.on(actions.newTab, async (store, action) => {
    store.dispatch(actions.navigate({ url: "itch://new-tab" }));
  });

  watcher.on(actions.focusNthTab, async (store, action) => {
    const n = action.payload.index;
    const constant = store.getState().profile.navigation.openTabs.constant;
    const tab = constant[n - 1];
    if (tab) {
      store.dispatch(actions.focusTab({ tab }));
    }
  });

  watcher.on(actions.showPreviousTab, async (store, action) => {
    await applyTabOffset(store, -1);
  });

  watcher.on(actions.showNextTab, async (store, action) => {
    await applyTabOffset(store, 1);
  });
}
