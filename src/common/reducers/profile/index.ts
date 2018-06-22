import { combineReducers } from "redux";
import login from "./login";
import profile from "./profile";
import search from "./search";
import itchioUris from "./itchio-uris";

import { Reducer } from "redux";
import { ProfileState } from "common/types";

const reducers: any = {
  login,
  profile,
  search,
  itchioUris,
};

export default combineReducers(reducers) as Reducer<ProfileState>;
