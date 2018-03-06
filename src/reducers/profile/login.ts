import { IProfileLoginState } from "../../types";
import { actions } from "../../actions";
import reducer from "../reducer";

const initialState = {
  picking: true,
  errors: [],
  blockingOperation: null,
} as IProfileLoginState;

export default reducer<IProfileLoginState>(initialState, on => {
  on(actions.attemptLogin, (state, action) => {
    return {
      ...state,
      errors: [],
      blockingOperation: {
        icon: "heart-filled",
        message: ["login.status.login"],
      },
    };
  });

  on(actions.loginStartPicking, (state, action) => {
    return { ...state, picking: true };
  });

  on(actions.loginStopPicking, (state, action) => {
    return { ...state, picking: false };
  });

  on(actions.loginFailed, (state, action) => {
    const { errors } = action.payload;
    // set picking to false because if we were trying a key login, we probably want
    // to re-enter the password to see if we can obtain a new API token
    return {
      ...initialState,
      errors,
      blockingOperation: null,
      picking: false,
    };
  });

  on(actions.loginCancelled, (state, action) => {
    return {
      ...state,
      blockingOperation: null,
      picking: false,
    };
  });

  on(actions.loginSucceeded, (state, action) => {
    return initialState;
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
