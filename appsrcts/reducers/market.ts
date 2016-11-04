
import makeMarketReducer from "./make-market-reducer";
import {getUserMarket} from "../reactors/market";

import {
  IAction,
  LOGOUT,
} from "../constants/action-types";

import {
  IMarketState,
} from "../types/db";

const reducer = makeMarketReducer("USER", getUserMarket, [
  "collections",
  "downloadKeys",
  "games",
  "itchAppProfile",
  "itchAppTabs",
  "users",
]);

export default (state: IMarketState, action: IAction<any>) => {
  // FIXME: this is a workaround, shouldn't be needed,
  // but without it, sessionReady fires too soon on 2nd login
  if (action.type === LOGOUT) {
    return Object.assign({}, state, {ready: false});
  } else {
    return reducer(state, action);
  }
};
