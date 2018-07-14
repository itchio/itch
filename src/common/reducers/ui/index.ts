import { combineReducers } from "redux";

import menu from "common/reducers/ui/menu";

import { Reducer } from "redux";

import { UIState } from "common/types";

export default combineReducers({
  menu,
}) as Reducer<UIState>;
