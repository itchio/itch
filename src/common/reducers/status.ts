import { StatusState } from "common/types";
import reducer from "common/reducers/reducer";

import { rest } from "underscore";
import { actions } from "common/actions";

const initialState = {
  messages: [],
  openAtLoginError: null,
  reduxLoggingEnabled: false,
} as StatusState;

export default reducer<StatusState>(initialState, (on) => {
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
