
import {combineReducers} from "redux";

import mainWindow from "./main-window";
import menu from "./menu";

import {Reducer} from "redux";

import {IUIState} from "../../types/db";

export default combineReducers({
  mainWindow,
  menu,
}) as Reducer<IUIState>;
