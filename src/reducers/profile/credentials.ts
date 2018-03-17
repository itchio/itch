import { IProfileCredentialsState } from "../../types";
import { actions } from "../../actions";
import reducer from "../reducer";

const initialState = {
  key: null,
  me: null,
} as IProfileCredentialsState;

export default reducer<IProfileCredentialsState>(initialState, on => {
  on(actions.loginSucceeded, (state, action) => {
    const { profile } = action.payload;
    return {
      ...state,
      key: "DUMMY",
      me: profile.user,
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
