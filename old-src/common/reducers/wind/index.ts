import { combineReducers } from "redux";

import properties from "common/reducers/wind/properties";
import modals from "common/reducers/wind/modals";
import tabInstances from "common/reducers/wind/tab-instances";
import navigation from "common/reducers/wind/navigation";
import native from "common/reducers/wind/native";
import { WindState } from "common/types";

export default combineReducers<WindState>({
  properties,
  modals,
  tabInstances,
  navigation,
  native,
});
