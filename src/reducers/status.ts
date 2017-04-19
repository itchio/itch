
import {IStatusState} from "../types";
import * as actions from "../actions";
import reducer from "./reducer";

import {rest, omit} from "underscore";

const initialState = {
  messages: [],
  bonuses: {},
  openAtLoginError: null,
} as IStatusState;

export default reducer<IStatusState>(initialState, (on) => {
  on(actions.statusMessage, (state, action) => {
    const {message} = action.payload;

    return {
      ...state,
      messages: [
        message,
        ...state.messages,
      ],
    };
  });

  on(actions.dismissStatusMessage, (state, action) => {
    return {
      ...state,
      messages: rest(state.messages),
    };
  });

  on(actions.enableBonus, (state, action) => {
    const {name} = action.payload;

    return {
      ...state,
      bonuses: {
        ...state.bonuses,
        [name]: true,
      },
    };
  });

  on(actions.disableBonus, (state, action) => {
    const {name} = action.payload;

    return {
      ...state,
      bonuses: omit(state.bonuses, name),
    };
  });

  on(actions.openAtLoginError, (state, action) => {
    const error = action.payload;
    return {
      ...state,
      openAtLoginError: error,
    };
  });
});
