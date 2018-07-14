import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { Profile } from "common/butlerd/messages";

const initialState = null as Profile;

export default reducer<Profile>(initialState, on => {
  on(actions.loginSucceeded, (state, action) => {
    const { profile } = action.payload;
    return profile;
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
