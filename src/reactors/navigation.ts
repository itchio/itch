
import {Watcher} from "./watcher";

import {object, map} from "underscore";

import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.clearFilters, async (store, action) => {
    const {tab} = action.payload;

    store.dispatch(actions.updatePreferences({onlyCompatibleGames: false}));
    store.dispatch(actions.filterChanged({tab, query: ""}));
  });

  watcher.on(actions.navigate, async (store, action) => {
    const state = store.getState();
    const {id} = action.payload;

    const {tabData} = state.session.navigation;

    const pathToId = object(map(tabData, (x, xId) => [x.path, xId]));

    if (tabData[id]) {
      // switching to existing tab by id - that's fine
    } else if (pathToId[id]) {
      // switching to existing tab by path - that's fine
    } else {
      // woop, that's a new tab
      store.dispatch(actions.openTab(action.payload));
    }
  });
}
