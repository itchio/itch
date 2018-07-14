import { combineReducers } from "redux";

import modals from "common/reducers/wind/modals";
import contextMenu from "common/reducers/wind/context-menu";
import tabInstances from "common/reducers/wind/tab-instances";
import navigation from "common/reducers/wind/navigation";
import native from "common/reducers/wind/native";
import { WindState } from "common/types";

export default combineReducers<WindState>({
  modals,
  contextMenu,
  tabInstances,
  navigation,
  native,
});
