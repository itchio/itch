import { ProfileCredentialsState } from "common/types";
import { actions } from "common/actions";
import reducer from "../reducer";

const initialState = {
  me: null,
} as ProfileCredentialsState;

export default reducer<ProfileCredentialsState>(initialState, on => {
  on(actions.loginSucceeded, (state, action) => {
    const { profile } = action.payload;
    return {
      ...state,
      me: profile.user,
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
