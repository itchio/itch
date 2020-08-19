import { GameUpdatesState } from "common/types";
import { omit } from "underscore";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState = {
  updates: {},
  checking: false,
  progress: -1,
} as GameUpdatesState;

export default reducer<GameUpdatesState>(initialState, (on) => {
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
        [update.caveId]: update,
      },
    };
  });

  on(actions.queueGameUpdate, (state, action) => {
    const { update } = action.payload;

    return {
      ...state,
      updates: omit(state.updates, update.caveId),
    };
  });

  on(actions.snoozeCave, (state, action) => {
    const { caveId } = action.payload;

    return {
      ...state,
      updates: omit(state.updates, caveId),
    };
  });
});
