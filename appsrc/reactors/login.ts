
import {Watcher} from "./watcher";
import * as actions from "../actions";

import client from "../util/api";

import {sortBy} from "underscore";

async function getKey (username: string, password: string) {
  const res = await client.loginWithPassword(username, password);
  return res.key.key;
}

export default function (watcher: Watcher) {
  watcher.on(actions.loginWithPassword, async (store, action) => {
    const {username, password} = action.payload;

    store.dispatch(actions.attemptLogin({}));

    try {
      const key = await getKey(username, password);
      const keyClient = client.withKey(key);

      // validate API key and get user profile in one fell swoop
      const me = (await keyClient.me()).user;
      store.dispatch(actions.loginSucceeded({key, me}));
    } catch (e) {
      store.dispatch(actions.loginFailed({username, errors: e.errors || e.stack || e}));
    }
  });

  watcher.on(actions.loginWithToken, async (store, action) => {
    const {username, key} = action.payload;

    store.dispatch(actions.attemptLogin({}));

    try {
      const keyClient = client.withKey(key);

      // validate API key and get user profile in one fell swoop
      const me = (await keyClient.me()).user;
      store.dispatch(actions.loginSucceeded({key, me}));
    } catch (e) {
      const {me} = action.payload;
      if (me && e.code === "ENOTFOUND") {
        store.dispatch(actions.loginSucceeded({key, me}));
      } else {
        store.dispatch(actions.loginFailed({username, errors: e.errors || e.stack || e}));
      }
    }
  });

  watcher.on(actions.sessionsRemembered, async (store, action) => {
    const rememberedSessions = action.payload;
    const mostRecentSession = sortBy(rememberedSessions, (x) => -x.lastConnected)[0];
    if (mostRecentSession) {
      const {me, key} = mostRecentSession;
      const {username} = me;
      store.dispatch(actions.loginWithToken({username, key, me}));
    }
  });
}
