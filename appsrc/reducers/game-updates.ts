
import {handleActions} from "redux-actions";

import {IGameUpdatesState} from "../types";

import {
  IAction,
  IGameUpdateAvailablePayload,
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
}, initialState);
