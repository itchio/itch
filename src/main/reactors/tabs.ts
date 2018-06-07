import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

import { IStore } from "common/types";

async function applyTabOffset(store: IStore, window: string, offset: number) {
  const { tab, openTabs } = store.getState().windows[window].navigation;

  const numTabs = openTabs.length;
  const index = openTabs.indexOf(tab);

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs;
  const newTab = openTabs[newIndex];

  store.dispatch(actions.focusTab({ window, tab: newTab }));
}

export default function(watcher: Watcher) {
  watcher.on(actions.newTab, async (store, action) => {
    const { window } = action.payload;
    store.dispatch(actions.navigate({ window, url: "itch://new-tab" }));
  });

  watcher.on(actions.focusNthTab, async (store, action) => {
    const { window } = action.payload;
    const n = action.payload.index;
    const { openTabs } = store.getState().windows[window].navigation;
    const tab = openTabs[n - 1];
    if (tab) {
      store.dispatch(actions.focusTab({ window, tab }));
    }
  });

  watcher.on(actions.showPreviousTab, async (store, action) => {
    const { window } = action.payload;
    await applyTabOffset(store, window, -1);
  });

  watcher.on(actions.showNextTab, async (store, action) => {
    const { window } = action.payload;
    await applyTabOffset(store, window, 1);
  });
}
