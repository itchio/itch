import { ProfileLoginState } from "common/types";
import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState: ProfileLoginState = {
  blockingOperation: null,
};

export default reducer<ProfileLoginState>(initialState, (on) => {
  on(actions.initiateOAuthLogin, (state, action) => {
    return {
      ...state,
      error: undefined,
    };
  });

  on(actions.oauthURLGenerated, (state, action) => {
    return {
      ...state,
      oauthURL: action.payload.url,
    };
  });

  on(actions.attemptLogin, (state, action) => {
    return {
      ...state,
      blockingOperation: {
        icon: "heart-filled",
        message: ["login.status.login"],
      },
    };
  });

  on(actions.loginFailed, (state, action) => {
    const { error, username } = action.payload;

    return {
      ...initialState,
      error,
      blockingOperation: null,
      lastUsername: username,
    };
  });

  on(actions.loginCancelled, (state, action) => {
    return {
      ...state,
      blockingOperation: null,
    };
  });

  on(actions.loginSucceeded, (state, action) => {
    return initialState;
  });

  on(actions.loggedOut, (state, action) => {
    return initialState;
  });
});
