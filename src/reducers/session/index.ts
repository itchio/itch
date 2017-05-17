
import {combineReducers} from "redux";
import login from "./login";
import credentials from "./credentials";
import navigation from "./navigation";
import search from "./search";
import folders from "./folders";
import cachedCollections from "./cached-collections";
import market from "./market";

import {Reducer} from "redux";
import {ISessionState} from "../../types";

let reducers: any = {
  login,
  credentials,
  navigation,
  search,
  folders,
  cachedCollections,
  market,
};

if (process.type === "renderer") {
  // renderer gets a few more reducers
  reducers = {
    ...reducers,
    tabData: require("./tab-data").default,
    tabParams: require("./tab-params").default,
  };
}

export default combineReducers(reducers) as Reducer<ISessionState>;
