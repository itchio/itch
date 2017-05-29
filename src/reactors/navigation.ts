
import * as actions from "../actions";
import {Watcher} from "./watcher";

import {createSelector} from "reselect";

import {findWhere} from "underscore";

import {IAppState, IStore} from "../types";

let pathSelector: (state: IAppState) => void;
const makePathSelector = (store: IStore) => createSelector(
  (state: IAppState) => state.session.navigation.id,
  (id) => {
    setImmediate(() => {
      store.dispatch(actions.tabChanged({id}));
    });
  },
);

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

    if (tabData[id]) {
      // switching to existing tab by id - that's fine
    } else if (findWhere(tabData, {path: id})) {
      // switching to existing tab by path - that's fine
    } else {
      // woop, that's a new tab
      store.dispatch(actions.openTab(action.payload));
    }
  });

  watcher.onAll(async (store, action) => {
    if (!pathSelector) {
      pathSelector = makePathSelector(store);
      pathSelector = createSelector(
        (state: IAppState) => state.session.navigation.id,
        (id) => {
          setImmediate(() => {
            store.dispatch(actions.tabChanged({id}));
          });
        },
      );
    }
    pathSelector(store.getState());
  });
}
