import { IStatusState } from "../types";
import * as actions from "../actions";
import reducer from "./reducer";

import { rest } from "underscore";

const initialState = {
  messages: [],
  openAtLoginError: null,
  reduxLoggingEnabled: false,
} as IStatusState;

export default reducer<IStatusState>(initialState, on => {
  on(actions.statusMessage, (state, action) => {
    const { message } = action.payload;

    return {
      ...state,
      messages: [message, ...state.messages],
    };
  });

  on(actions.dismissStatusMessage, (state, action) => {
    return {
      ...state,
      messages: rest(state.messages),
    };
  });

  on(actions.openAtLoginError, (state, action) => {
    const error = action.payload;
    return {
      ...state,
      openAtLoginError: error,
    };
  });

  on(actions.setReduxLoggingEnabled, (state, action) => {
    const { enabled } = action.payload;
    return {
      ...state,
      reduxLoggingEnabled: enabled,
    };
  });
});
