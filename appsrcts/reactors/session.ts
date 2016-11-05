
import {createSelector} from "reselect";

import * as actions from "../actions";

import delay from "./delay";

import {IStore, IState} from "../types";
import {IAction, ILogoutPayload, ISessionReadyPayload} from "../constants/action-types";

async function logout (store: IStore, action: IAction<ILogoutPayload>) {
  store.dispatch(actions.switchPage("gate"));
}

async function sessionReady (store: IStore, action: IAction<ISessionReadyPayload>) {
  const me = store.getState().session.credentials.me;
  if (me.developer) {
    store.dispatch(actions.unlockTab({path: "dashboard"}));
  }

  await delay(500);

  store.dispatch(actions.switchPage("hub"));
}

let sessionSelector: (state: IState) => void;
const makeSessionSelector = (store: IStore) => createSelector(
  (state: IState) => state.setup.done,
  (state: IState) => state.market.ready,
  (state: IState) => state.session.credentials.key,
  (setupDone, marketReady, loginDone) => {
    if (setupDone && marketReady && loginDone) {
      setImmediate(() => {
        store.dispatch(actions.sessionReady());
      });
    }
  }
);

async function catchAll (store: IStore, action: IAction<any>) {
  if (!sessionSelector) {
    sessionSelector = makeSessionSelector(store);
  }
  sessionSelector(store.getState());
}

export default {sessionReady, logout, catchAll};
