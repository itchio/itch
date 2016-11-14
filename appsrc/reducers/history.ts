
import * as invariant from "invariant";

import {handleActions} from "redux-actions";
import {createStructuredSelector} from "reselect";
import {sortBy, omit, map, indexBy, filter} from "underscore";

import {IHistoryState} from "../types";

import derivedReducer from "./derived-reducer";

import {
  IAction,
  IQueueHistoryItemPayload,
  IDismissHistoryItemPayload,
  IHistoryReadPayload,
} from "../constants/action-types";

const initialState = {
  items: {},
  itemsByDate: [],
} as IHistoryState;

const reducer = handleActions<IHistoryState, any>({
  QUEUE_HISTORY_ITEM: (state: IHistoryState, action: IAction<IQueueHistoryItemPayload>) => {
    const {payload} = action;
    const {items} = state;
    return Object.assign({}, state, {items: Object.assign({}, items, {[payload.id]: payload})});
  },

  DISMISS_HISTORY_ITEM: (state: IHistoryState, action: IAction<IDismissHistoryItemPayload>) => {
    const {id} = action.payload;
    invariant(typeof id === "string", "dismissing valid history item");
    const {items} = state;
    return Object.assign({}, state, {items: omit(items, id)});
  },

  HISTORY_READ: (state: IHistoryState, action: IAction<IHistoryReadPayload>) => {
    const {items} = state;
    const newItems = indexBy(map(items, (item, id) => Object.assign({}, item, {active: false})), "id");
    return Object.assign({}, state, {items: newItems});
  },
}, initialState);

const selector = createStructuredSelector({
  itemsByDate: (state: IHistoryState) => sortBy(state.items, (x) => -x.date),
  numActiveItems: (state: IHistoryState) => filter(state.items, (x) => x.active).length,
});

export default derivedReducer(reducer, selector);
