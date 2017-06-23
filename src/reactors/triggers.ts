import { Watcher } from "./watcher";

import * as actions from "../actions";

import { pathToId } from "../util/navigation";

import { sortBy } from "underscore";

export default function(watcher: Watcher) {
  watcher.on(actions.triggerMainAction, async (store, action) => {
    const id = store.getState().session.navigation.id;
    const data = store.getState().session.tabData[id];
    if (!data) {
      return;
    }

    const { path } = data;
    if (/^games/.test(path)) {
      const gameId = +pathToId(path);
      const game = (data.games || {})[gameId];
      if (game) {
        // FIXME: queueGame doesn't always do the right thing.
        // it'll try installing even if there's no chance you'll be able
        // to download it (for example, if you need to purchase it first)
        store.dispatch(actions.queueGame({ game }));
      }
    }
  });

  watcher.on(actions.triggerOk, async (store, action) => {
    const modals = store.getState().modals;
    const [modal] = modals;
    if (!modal) {
      const page = store.getState().session.navigation.page;
      const picking = store.getState().session.login.picking;
      if (page === "gate" && picking) {
        const rememberedSessions = store.getState().rememberedSessions;
        const mostRecentSession = sortBy(
          rememberedSessions,
          x => -x.lastConnected,
        )[0];
        if (mostRecentSession) {
          const { me, key } = mostRecentSession;
          const { username } = me;
          store.dispatch(actions.loginWithToken({ username, key, me }));
        }
      }
      return;
    }
  });

  watcher.on(actions.triggerBack, async (store, action) => {
    const modals = store.getState().modals;
    const [modal] = modals;
    if (modal) {
      store.dispatch(actions.closeModal({}));
    }
  });
}
