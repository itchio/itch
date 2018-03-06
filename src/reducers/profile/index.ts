import { combineReducers } from "redux";
import login from "./login";
import credentials from "./credentials";
import navigation from "./navigation";
import search from "./search";
import tabInstances from "./tab-instances";

import { Reducer } from "redux";
import { IProfileState } from "../../types";

const reducers: any = {
  login,
  credentials,
  navigation,
  search,
  tabInstances,
};

export default combineReducers(reducers) as Reducer<IProfileState>;
