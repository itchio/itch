import { Watcher } from "./watcher";

import * as actions from "../actions";

import { sortBy } from "underscore";
import { Space } from "../helpers/space";

export default function(watcher: Watcher) {
  watcher.on(actions.trigger, async (store, action) => {
    const { command, tab } = action.payload;

    const sp = Space.fromStore(
      store,
      tab || store.getState().session.navigation.tab
    );
    const modals = store.getState().modals;
    const [modal] = modals;

    switch (command) {
      case "main": {
        if (sp.prefix === "games") {
          const game = sp.game();
          if (game) {
            // FIXME: queueGame doesn't always do the right thing.
            // it'll try installing even if there's no chance you'll be able
            // to download it (for example, if you need to purchase it first)
            store.dispatch(actions.queueGame({ game }));
          }
        }
        break;
      }

      case "ok": {
        if (!modal) {
          const page = store.getState().session.navigation.page;
          const picking = store.getState().session.login.picking;
          if (page === "gate" && picking) {
            const rememberedSessions = store.getState().rememberedSessions;
            const mostRecentSession = sortBy(
              rememberedSessions,
              x => -x.lastConnected
            )[0];
            if (mostRecentSession) {
              const { me, key } = mostRecentSession;
              const { username } = me;
              store.dispatch(actions.loginWithToken({ username, key, me }));
            }
          }
        }
        break;
      }

      case "back": {
        if (modal) {
          store.dispatch(actions.closeModal({}));
        }
        break;
      }
    }
  });
}
