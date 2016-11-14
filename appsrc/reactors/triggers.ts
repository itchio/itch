
import * as actions from "../actions";

import {pathToId} from "../util/navigation";

import {sortBy} from "underscore";

import {IStore, IModalButtonSpec} from "../types";
import {
  IAction,
  ITriggerMainActionPayload,
  ITriggerOkPayload,
  ITriggerBackPayload,
} from "../constants/action-types";

async function triggerMainAction (store: IStore, action: IAction<ITriggerMainActionPayload>) {
  const id = store.getState().session.navigation.id;
  const data = store.getState().session.navigation.tabData[id];
  if (!data) {
    return;
  }

  const {path} = data;
  if (/^games/.test(path)) {
    const gameId = +pathToId(path);
    const game = (data.games || {})[gameId];
    if (game) {
      // FIXME: queueGame doesn't always do the right thing.
      // it'll try installing even if there's no chance you'll be able
      // to download it (for example, if you need to purchase it first)
      store.dispatch(actions.queueGame({game}));
    }
  }
}

async function triggerOk (store: IStore, action: IAction<ITriggerOkPayload>) {
  const modals = store.getState().modals;
  const [modal] = modals;
  if (!modal) {
    const page = store.getState().session.navigation.page;
    const picking = store.getState().session.login.picking;
    if (page === "gate" && picking) {
      const rememberedSessions = store.getState().rememberedSessions;
      const mostRecentSession = sortBy(rememberedSessions, ((x) => -x.lastConnected))[0];
      if (mostRecentSession) {
        const {me, key} = mostRecentSession;
        const {username} = me;
        store.dispatch(actions.loginWithToken({username, key, me}));
      }
    }
    return;
  }

  const button: IModalButtonSpec = (modal.bigButtons || modal.buttons || [])[0];
  if (!button) {
    return;
  }

  // FIXME: naughty any
  store.dispatch(actions.closeModal({action: (button as any).action}));
}

async function triggerBack (store: IStore, action: IAction<ITriggerBackPayload>) {
  const modals = store.getState().modals;
  const [modal] = modals;
  if (!modal) {
    return;
  }

  store.dispatch(actions.closeModal());
}

export default {triggerMainAction, triggerOk, triggerBack};
