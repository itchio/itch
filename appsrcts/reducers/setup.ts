
import {handleActions} from "redux-actions";

import {ISetupState} from "../types";

import {
  IAction,
  ISetupStatusPayload,
  ISetupDonePayload,
} from "../constants/action-types";

const initialState = {
  done: false,
  errors: [],
  blockingOperation: null,
} as ISetupState;

export default handleActions<ISetupState, any>({
  SETUP_STATUS: (state: ISetupState, action: IAction<ISetupStatusPayload>) => {
    return Object.assign({}, state, {
      errors: [],
      blockingOperation: action.payload,
    });
  },

  SETUP_DONE: (state: ISetupState, action: IAction<ISetupDonePayload>) => {
    return Object.assign({}, state, {
      done: true,
      errors: [],
      blockingOperation: null,
    });
  },
}, initialState);
