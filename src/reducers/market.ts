
import makeMarketReducer from "./make-market-reducer";
import {getUserMarket} from "../reactors/market";

import {createSelector, createStructuredSelector} from "reselect";
import {indexBy} from "underscore";

import derivedReducer from "./derived-reducer";

import {
  IAction,
  LOGOUT,
} from "../constants/action-types";

import {
  IUserMarketState,
  IDownloadKeysMap,
} from "../types";

const reducer = makeMarketReducer("USER", getUserMarket, [
  "collections",
  "downloadKeys",
  "games",
  "itchAppProfile",
  "itchAppTabs",
  "users",
]);

const fixedReducer = (state: IUserMarketState, action: IAction<any>) => {
  // FIXME: this is a workaround, shouldn't be needed,
  // but without it, sessionReady fires too soon on 2nd login
  if (action.type === LOGOUT) {
    return {...state, ready: false};
  } else {
    return reducer(state, action);
  }
};

export default derivedReducer(fixedReducer, createSelector(
  (state: IUserMarketState) => state.downloadKeys,
  createStructuredSelector({
    downloadKeysByGameId: (downloadKeys: IDownloadKeysMap) => indexBy(downloadKeys, "gameId"),
  }),
));
