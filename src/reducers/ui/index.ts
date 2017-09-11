import { combineReducers } from "redux";

import mainWindow from "./main-window";
import menu from "./menu";
import contextMenu from "./context-menu";

import { Reducer } from "redux";

import { IUIState } from "../../types";

export default combineReducers({
  mainWindow,
  menu,
  contextMenu,
}) as Reducer<IUIState>;
