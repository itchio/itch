
import {Watcher} from "./watcher";

import {createSelector} from "reselect";

import * as actions from "../actions";

import delay from "./delay";

import {IStore, IAppState} from "../types";

let sessionSelector: (state: IAppState) => void;
const makeSessionSelector = (store: IStore) => createSelector(
  (state: IAppState) => state.setup.done,
  (state: IAppState) => state.market.ready,
  (state: IAppState) => state.session.credentials.key,
  (setupDone, marketReady, loginDone) => {
    if (setupDone && marketReady && loginDone) {
      setImmediate(() => {
        store.dispatch(actions.sessionReady({}));
      });
    }
  },
);

export default function (watcher: Watcher) {
  watcher.on(actions.sessionReady, async (store, action) => {
    const me = store.getState().session.credentials.me;
    if (me.developer) {
      store.dispatch(actions.unlockTab({path: "dashboard"}));
    }

    await delay(500);

    store.dispatch(actions.switchPage({page: "hub"}));
  });

  watcher.on(actions.logout, async (store, action) => {
    store.dispatch(actions.switchPage({page: "gate"}));
  });

  watcher.onAll(async (store, action) => {
    if (!sessionSelector) {
      sessionSelector = makeSessionSelector(store);
    }
    sessionSelector(store.getState());
  });
}
