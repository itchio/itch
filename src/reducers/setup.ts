import { ISetupState } from "../types";
import { actions } from "../actions";
import reducer from "./reducer";

const initialState = {
  done: false,
  errors: [],
  blockingOperation: {
    icon: "moon",
    message: ["login.status.dependency_check"],
  },
} as ISetupState;

export default reducer<ISetupState>(initialState, on => {
  on(actions.setupStatus, (state, action) => {
    const blockingOperation = action.payload;
    return {
      ...state,
      errors: [],
      blockingOperation,
    };
  });

  on(actions.setupOperationProgress, (state, action) => {
    let { blockingOperation } = state;
    const { progress } = action.payload;
    if (blockingOperation) {
      blockingOperation = {
        ...blockingOperation,
        progressInfo: progress,
      };
    }
    return {
      ...state,
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
