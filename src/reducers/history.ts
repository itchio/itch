
import {createStructuredSelector} from "reselect";
import {sortBy, omit, map, indexBy, filter} from "underscore";

import {IHistoryState} from "../types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";

const initialState = {
  items: {},
  itemsByDate: [],
} as IHistoryState;

const baseReducer = reducer<IHistoryState>(initialState, (on) => {
  on(actions.queueHistoryItem, (state, action) => {
    const {payload} = action;
    return {
      ...state,
      items: {
        ...state.items,
        [payload.id]: payload,
      },
    };
  });

  on(actions.dismissHistoryItem, (state, action) => {
    const {id} = action.payload;
    return {
      ...state,
      items: omit(state.items, id),
    };
  });

  on(actions.historyRead, (state, action) => {
    return {
      ...state,
      items: indexBy(map(state.items, (item, id) => ({
        ...item,
        active: false,
      })), "id"),
    };
  });
});

const selector = createStructuredSelector({
  itemsByDate: (state: IHistoryState) => sortBy(state.items, (x) => -x.date),
  numActiveItems: (state: IHistoryState) => filter(state.items, (x) => x.active).length,
});

export default derivedReducer(baseReducer, selector);
