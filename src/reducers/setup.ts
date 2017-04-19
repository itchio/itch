
import {ISetupState} from "../types";
import * as actions from "../actions";
import reducer from "./reducer";

const initialState = {
  done: false,
  errors: [],
  blockingOperation: null,
} as ISetupState;

export default reducer<ISetupState>(initialState, (on) => {
  on(actions.setupStatus, (state, action) => {
    const blockingOperation = action.payload;
    return {
      ...state,
      errors: [],
      blockingOperation,
    };
  });

  on(actions.setupDone, (state, action) => {
    return {
      ...state,
      done: true,
      errors: [],
      blockingOperation: null,
    };
  });
});
