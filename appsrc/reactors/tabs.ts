
import {Watcher} from "./watcher";

import * as uuid from "uuid";

import * as actions from "../actions";

import {IStore} from "../types";

async function applyTabOffset (store: IStore, offset: number) {
  const {id, tabs} = store.getState().session.navigation;
  const {constant, transient} = tabs;

  const ids = constant.concat(transient);
  const numTabs = ids.length;

  const index = ids.indexOf(id);

  // adding numPaths takes care of negative wrapping too!
  const newIndex = (index + offset + numTabs) % numTabs;
  const newId = ids[newIndex];

  store.dispatch(actions.navigate(newId));
}

export default function (watcher: Watcher) {
  watcher.on(actions.newTab, async (store, action) => {
    store.dispatch(actions.navigate("new/" + uuid.v4()));
  });

  watcher.on(actions.focusNthTab, async (store, action) => {
    const n = action.payload.index;
    const constant = store.getState().session.navigation.tabs.constant;
    const tab = constant[n - 1];
    if (tab) {
      store.dispatch(actions.navigate(tab));
    }
  });

  watcher.on(actions.showPreviousTab, async (store, action) => {
    await applyTabOffset(store, -1);
  });

  watcher.on(actions.showNextTab, async (store, action) => {
    await applyTabOffset(store, 1);
  });
}
