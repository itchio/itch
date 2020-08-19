import { combineReducers } from "redux";
import login from "common/reducers/profile/login";
import profile from "common/reducers/profile/profile";
import itchioUris from "common/reducers/profile/itchio-uris";

import { Reducer } from "redux";
import { ProfileState } from "common/types";

const reducers = {
  login,
  profile,
  itchioUris,
};

export default combineReducers(reducers) as Reducer<ProfileState>;
