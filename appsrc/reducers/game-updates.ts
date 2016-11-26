
import {handleActions} from "redux-actions";

import {IGameUpdatesState} from "../types";
import {omit} from "underscore";

import {
  IAction,
  IGameUpdateAvailablePayload,
  IQueueGameUpdatePayload,
} from "../constants/action-types";

const initialState = {
  updates: {},
} as IGameUpdatesState;

export default handleActions<IGameUpdatesState, any>({
  GAME_UPDATE_AVAILABLE: (state: IGameUpdatesState, action: IAction<IGameUpdateAvailablePayload>) => {
    const updates = Object.assign({}, state.updates, {
      [action.payload.caveId]: action.payload.update,
    });

    return Object.assign({}, state, {updates});
  },

  QUEUE_GAME_UPDATE: (state: IGameUpdatesState, action: IAction<IQueueGameUpdatePayload>) => {
    const updates = omit(state.updates, action.payload.caveId);

    return Object.assign({}, state, {updates});
  },
}, initialState);
