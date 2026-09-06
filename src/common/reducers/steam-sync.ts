import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { SteamSyncState } from "common/types";

const initialState: SteamSyncState = {
  status: null,
  login: null,
  keySaving: false,
  apps: null,
  appsLoading: false,
};

export default reducer<SteamSyncState>(initialState, (on) => {
  on(actions.steamSyncOpen, (state) => {
    return { ...state, loginError: undefined, keyError: undefined };
  });

  on(actions.steamSyncStatus, (state, action) => {
    const { status } = action.payload;
    const keyChanged =
      !state.status || state.status.hasPublisherKey !== status.hasPublisherKey;
    return { ...state, status, apps: keyChanged ? null : state.apps };
  });

  on(actions.steamSyncStartLogin, (state, action) => {
    const { id } = action.payload;
    return { ...state, login: { id }, loginError: undefined };
  });

  on(actions.steamSyncLoginChallenge, (state, action) => {
    const { id, url } = action.payload;
    if (!state.login || state.login.id !== id) {
      return state;
    }
    return { ...state, login: { ...state.login, challengeUrl: url } };
  });

  on(actions.steamSyncLoginDone, (state, action) => {
    if (!state.login || state.login.id !== action.payload.id) {
      return state;
    }
    return { ...state, login: null };
  });

  on(actions.steamSyncLoginFailed, (state, action) => {
    const { id, message } = action.payload;
    if (!state.login || state.login.id !== id) {
      return state;
    }
    return { ...state, login: null, loginError: message };
  });

  on(actions.steamSyncCancelLogin, (state, action) => {
    if (!state.login || state.login.id !== action.payload.id) {
      return state;
    }
    return { ...state, login: null, loginError: undefined };
  });

  on(actions.steamSyncSetPublisherKey, (state) => {
    return { ...state, keySaving: true, keyError: undefined };
  });

  on(actions.steamSyncKeySaved, (state) => {
    return { ...state, keySaving: false };
  });

  on(actions.steamSyncKeyFailed, (state, action) => {
    return { ...state, keySaving: false, keyError: action.payload.message };
  });

  on(actions.steamSyncFetchApps, (state) => {
    return { ...state, appsLoading: true, appsError: undefined };
  });

  on(actions.steamSyncApps, (state, action) => {
    return { ...state, apps: action.payload.apps, appsLoading: false };
  });

  on(actions.steamSyncAppsFailed, (state, action) => {
    return { ...state, appsLoading: false, appsError: action.payload.message };
  });
});
