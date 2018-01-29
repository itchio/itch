import { combineReducers } from "redux";
import login from "./login";
import credentials from "./credentials";
import navigation from "./navigation";
import search from "./search";
import folders from "./folders";
import tabData from "./tab-data";
import tabParams from "./tab-params";

import { Reducer } from "redux";
import { ISessionState } from "../../types";

const reducers: any = {
  login,
  credentials,
  navigation,
  search,
  folders,
  tabData,
  tabParams,
};

export default combineReducers(reducers) as Reducer<ISessionState>;
