import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { Profile } from "common/butlerd/messages";

const initialState: Profile | null = null;

export default reducer<Profile | null>(initialState, (on) => {
  on(actions.loginSucceeded, (state, action) => {
    const { profile } = action.payload;
    return profile;
  });

  on(actions.loggedOut, (state, action) => {
    return initialState;
  });
});
