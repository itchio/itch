import { IGameUpdatesState } from "../types";
import { omit } from "underscore";

import * as actions from "../actions";
import reducer from "./reducer";

const initialState = {
  updates: {},
} as IGameUpdatesState;

export default reducer<IGameUpdatesState>(initialState, on => {
  on(actions.gameUpdateAvailable, (state, action) => {
    const { caveId, update } = action.payload;

    return {
      ...state,
      updates: {
        ...state.updates,
        [caveId]: update,
      },
    };
  });

  on(actions.queueGameUpdate, (state, action) => {
    const { caveId } = action.payload;

    return {
      ...state,
      updates: omit(state.updates, caveId),
    };
  });
});
