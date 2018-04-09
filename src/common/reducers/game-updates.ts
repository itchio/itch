import { IGameUpdatesState } from "common/types";
import { omit } from "underscore";

import { actions } from "common/actions";
import reducer from "./reducer";

const initialState = {
  updates: {},
  checking: false,
  progress: -1,
} as IGameUpdatesState;

export default reducer<IGameUpdatesState>(initialState, on => {
  on(actions.gameUpdateCheckStatus, (state, action) => {
    const { checking, progress } = action.payload;
    return {
      ...state,
      checking,
      progress,
    };
  });

  on(actions.gameUpdateAvailable, (state, action) => {
    const { update } = action.payload;

    return {
      ...state,
      updates: {
        ...state.updates,
        [update.itemId]: update,
      },
    };
  });

  on(actions.queueGameUpdate, (state, action) => {
    const { update } = action.payload;

    return {
      ...state,
      updates: omit(state.updates, update.itemId),
    };
  });
});
