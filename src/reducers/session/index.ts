
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

export default combineReducers({
  login,
  credentials,
  navigation,
  search,
  folders,
  cachedCollections,
  market,
}) as Reducer<ISessionState>;
