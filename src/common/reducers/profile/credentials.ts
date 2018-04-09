import { IProfileCredentialsState } from "common/types";
import { actions } from "common/actions";
import reducer from "../reducer";

const initialState = {
  me: null,
} as IProfileCredentialsState;

export default reducer<IProfileCredentialsState>(initialState, on => {
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
