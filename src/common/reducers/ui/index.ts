import { combineReducers } from "redux";

import menu from "./menu";

import { Reducer } from "redux";

import { UIState } from "common/types";

export default combineReducers({
  menu,
}) as Reducer<UIState>;
