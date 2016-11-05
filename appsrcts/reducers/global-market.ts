
import makeMarketReducer from "./make-market-reducer";
import {getGlobalMarket} from "../reactors/market";

import {createSelector, createStructuredSelector} from "reselect";
import {values, indexBy} from "underscore";

import derivedReducer from "./derived-reducer";

import {IGlobalMarketState, ICaveRecord} from "../types";

const reducer = makeMarketReducer("GLOBAL", getGlobalMarket, ["caves"]);

interface ICaveMap {
  [id: string]: ICaveRecord;
}

export default derivedReducer(reducer, createSelector(
  (state: IGlobalMarketState) => state.caves,
  createStructuredSelector({
    // TODO: remove unnecessary data duplication
    cavesByGameId: (caves: ICaveMap) => indexBy(values(caves), "gameId"),
  })
));
