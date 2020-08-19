import { SetupState } from "common/types";
import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState = {
  done: false,
  errors: [],
  blockingOperation: {
    icon: "moon",
    message: ["login.status.dependency_check"],
  },
} as SetupState;

export default reducer<SetupState>(initialState, (on) => {
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
