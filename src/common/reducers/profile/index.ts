import { combineReducers } from "redux";
import login from "./login";
import profile from "./profile";
import itchioUris from "./itchio-uris";

import { Reducer } from "redux";
import { ProfileState } from "common/types";

const reducers: any = {
  login,
  profile,
  itchioUris,
};

export default combineReducers(reducers) as Reducer<ProfileState>;
