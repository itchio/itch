import { combineReducers } from "redux";

import menu from "common/reducers/ui/menu";
import search from "common/reducers/ui/search";

import { Reducer } from "redux";

import { UIState } from "common/types";

export default combineReducers({
  menu,
  search,
}) as Reducer<UIState>;
