import { combineReducers } from "redux";
import login from "./login";
import credentials from "./credentials";
import navigation from "./navigation";
import search from "./search";
import folders from "./folders";
import tabInstances from "./tab-instances";

import { Reducer } from "redux";
import { ISessionState } from "../../types";

const reducers: any = {
  login,
  credentials,
  navigation,
  search,
  folders,
  tabInstances,
};

export default combineReducers(reducers) as Reducer<ISessionState>;
