
import {handleActions} from "redux-actions";

import {reject} from "underscore";

import {IModalsState} from "../types/db";

import {
  IAction,
  IOpenModalPayload,
  IModalClosedPayload,
} from "../constants/action-types";

const initialState: IModalsState = [];

export default handleActions<IModalsState, any>({
  OPEN_MODAL: (state: IModalsState, action: IAction<IOpenModalPayload>) => {
    const modal = action.payload;
    return [...state, modal];
  },

  MODAL_CLOSED: (state: IModalsState, action: IAction<IModalClosedPayload>) => {
    const {id} = action.payload;
    return reject(state, (x) => x.id === id);
  },
}, initialState);
