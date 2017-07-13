import { combineReducers } from "redux";
import login from "./login";
import credentials from "./credentials";
import navigation from "./navigation";
import search from "./search";
import folders from "./folders";
import cachedCollections from "./cached-collections";
import tabData from "./tab-data";
import tabParams from "./tab-params";
import tabPagination from "./tab-pagination";

import { Reducer } from "redux";
import { ISessionState } from "../../types";

const reducers: any = {
  login,
  credentials,
  navigation,
  search,
  folders,
  cachedCollections,
  tabData,
  tabParams,
  tabPagination,
};

export default combineReducers(reducers) as Reducer<ISessionState>;
