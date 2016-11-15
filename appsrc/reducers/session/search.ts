
import {handleActions} from "redux-actions";

import SearchExamples from "../../constants/search-examples";

import {ISessionSearchState} from "../../types";

import {
  IAction,
  ISearchPayload,
  ISearchHighlightOffsetPayload,
  ISearchFetchedPayload,
  ISearchStartedPayload,
  ISearchFinishedPayload,
  IFocusSearchPayload,
  ICloseSearchPayload,
} from "../../constants/action-types";

function randomExampleIndex () {
  return Math.floor(Math.random() * (SearchExamples.length - 1));
}

let searchExampleIndex = randomExampleIndex();

const initialState = {
  example: SearchExamples[searchExampleIndex],
  typedQuery: "",
  query: "",
  open: false,
  loading: false,
  highlight: 0,
  results: null,
} as ISessionSearchState;

export default handleActions<ISessionSearchState, any>({
  SEARCH: (state: ISessionSearchState, action: IAction<ISearchPayload>) => {
    const typedQuery: string = action.payload.query;
    if (!typedQuery) {
      return state;
    }

    return Object.assign({}, state, {typedQuery, highlight: 0});
  },

  SEARCH_HIGHLIGHT_OFFSET: (state: ISessionSearchState, action: IAction<ISearchHighlightOffsetPayload>) => {
    const offset: number = action.payload.offset;
    return Object.assign({}, state, {highlight: (state.highlight + offset)});
  },

  SEARCH_FETCHED: (state: ISessionSearchState, action: IAction<ISearchFetchedPayload>) => {
    const {query, results} = action.payload;
    const example = SearchExamples[randomExampleIndex()];
    return Object.assign({}, state, {results, query, example});
  },

  SEARCH_STARTED: (state: ISessionSearchState, action: IAction<ISearchStartedPayload>) => {
    return Object.assign({}, state, {loading: true});
  },

  SEARCH_FINISHED: (state: ISessionSearchState, action: IAction<ISearchFinishedPayload>) => {
    return Object.assign({}, state, {loading: false});
  },

  FOCUS_SEARCH: (state: ISessionSearchState, action: IAction<IFocusSearchPayload>) => {
    return Object.assign({}, state, {open: true});
  },

  CLOSE_SEARCH: (state: ISessionSearchState, action: IAction<ICloseSearchPayload>) => {
    return Object.assign({}, state, {open: false});
  },
}, initialState);
