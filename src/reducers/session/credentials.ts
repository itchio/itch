import { ISessionCredentialsState } from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {
  key: null,
  me: null,
} as ISessionCredentialsState;

export default reducer<ISessionCredentialsState>(initialState, on => {
  on(actions.loginSucceeded, (state, action) => {
    const { key, me } = action.payload;
    return {
      ...state,
      key,
      me,
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
