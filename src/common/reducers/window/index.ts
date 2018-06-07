import { combineReducers } from "redux";

import modals from "./modals";
import contextMenu from "./context-menu";
import tabInstances from "./tab-instances";
import navigation from "./navigation";
import native from "./native";
import { IWindowState } from "../../types";

export default combineReducers<IWindowState>({
  modals,
  contextMenu,
  tabInstances,
  navigation,
  native,
});
