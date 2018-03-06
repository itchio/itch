import { filter } from "underscore";

import { actions } from "../actions";
import reducer from "./reducer";

import { IRememberedProfilesState } from "../types";

const initialState = {} as IRememberedProfilesState;

export default reducer<IRememberedProfilesState>(initialState, on => {
  on(actions.profilesRemembered, (state, action) => {
    const sessions = action.payload;
    return sessions;
  });

  on(actions.forgetProfile, (state, action) => {
    const { profile } = action.payload;
    return {
      ...state,
      profiles: filter(state.profiles, x => x.id != profile.id),
    };
  });
});
