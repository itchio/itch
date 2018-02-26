import { ISessionCredentialsState } from "../../types";
import { actions } from "../../actions";
import reducer from "../reducer";

const initialState = {
  key: null,
  me: null,
} as ISessionCredentialsState;

export default reducer<ISessionCredentialsState>(initialState, on => {
  on(actions.loginSucceeded, (state, action) => {
    const { session } = action.payload;
    return {
      ...state,
      key: "DUMMY",
      me: session.user,
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
