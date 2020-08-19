import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";

import { Store } from "common/types";

async function applyTabOffset(store: Store, wind: string, offset: number) {
  const { tab, openTabs } = store.getState().winds[wind].navigation;

  const numTabs = openTabs.length;
  const index = openTabs.indexOf(tab);

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs;
  const newTab = openTabs[newIndex];

  store.dispatch(actions.tabFocused({ wind, tab: newTab }));
}

export default function (watcher: Watcher) {
  watcher.on(actions.newTab, async (store, action) => {
    const { wind } = action.payload;
    store.dispatch(actions.navigate({ wind, url: "itch://new-tab" }));
  });

  watcher.on(actions.focusNthTab, async (store, action) => {
    const { wind } = action.payload;
    const n = action.payload.index;
    const { openTabs } = store.getState().winds[wind].navigation;
    const tab = openTabs[n - 1];
    if (tab) {
      store.dispatch(actions.tabFocused({ wind, tab }));
    }
  });

  watcher.on(actions.showPreviousTab, async (store, action) => {
    const { wind } = action.payload;
    await applyTabOffset(store, wind, -1);
  });

  watcher.on(actions.showNextTab, async (store, action) => {
    const { wind } = action.payload;
    await applyTabOffset(store, wind, 1);
  });
}
