import { StatusState } from "common/types";
import reducer from "common/reducers/reducer";

import { actions } from "common/actions";

const initialState: StatusState = {
  messages: [],
  openAtLoginError: null,
  reduxLoggingEnabled: false,
};

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
      messages: state.messages.slice(1),
    };
  });

  on(actions.openAtLoginError, (state, action) => {
    const { error } = action.payload;
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
