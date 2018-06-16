import { combineReducers } from "redux";

import menu from "./menu";

import { Reducer } from "redux";

import { IUState } from "common/types";

export default combineReducers({
  menu,
}) as Reducer<IUState>;
