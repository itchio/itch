import { combineReducers } from "redux";

import menu from "./menu";

import { Reducer } from "redux";

import { IUIState } from "common/types";

export default combineReducers({
  menu,
}) as Reducer<IUIState>;
