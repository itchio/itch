
import makeMarketReducer from "./make-market-reducer";
import {getGlobalMarket} from "../reactors/market";

import {createSelector, createStructuredSelector} from "reselect";
import {indexBy} from "underscore";

import derivedReducer from "./derived-reducer";

import {IGlobalMarketState, ICaveRecord} from "../types";

const reducer = makeMarketReducer("GLOBAL", getGlobalMarket, ["caves"]);

interface ICaveMap {
  [id: string]: ICaveRecord;
}

export default derivedReducer(reducer, createSelector(
  (state: IGlobalMarketState) => state.caves,
  createStructuredSelector({
    cavesByGameId: (caves: ICaveMap) => indexBy(caves, "gameId"),
  }),
));
