import { combineReducers } from "redux";
import login from "./login";
import credentials from "./credentials";
import search from "./search";
import itchioUris from "./itchio-uris";

import { Reducer } from "redux";
import { ProfileState } from "common/types";

const reducers: any = {
  login,
  credentials,
  search,
  itchioUris,
};

export default combineReducers(reducers) as Reducer<ProfileState>;
