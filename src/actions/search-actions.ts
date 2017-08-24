import { createAction } from "redux-actions";

import {
  FOCUS_SEARCH,
  IFocusSearchPayload,
  CLEAR_FILTERS,
  IClearFiltersPayload,
  SEARCH,
  ISearchPayload,
  SEARCH_QUERY_CHANGED,
  ISearchQueryChangedPayload,
  SEARCH_FETCHED,
  ISearchFetchedPayload,
  SEARCH_STARTED,
  ISearchStartedPayload,
  SEARCH_FINISHED,
  ISearchFinishedPayload,
  CLOSE_SEARCH,
  ICloseSearchPayload,
  SEARCH_HIGHLIGHT_OFFSET,
  ISearchHighlightOffsetPayload,
} from "../constants/action-types";

export const focusSearch = createAction<IFocusSearchPayload>(FOCUS_SEARCH);
export const clearFilters = createAction<IClearFiltersPayload>(CLEAR_FILTERS);
export const search = createAction<ISearchPayload>(SEARCH);
export const searchQueryChanged = createAction<ISearchQueryChangedPayload>(
  SEARCH_QUERY_CHANGED
);
export const searchFetched = createAction<ISearchFetchedPayload>(
  SEARCH_FETCHED
);

// ugh
// TODO: de-ugh
export const searchStarted = createAction<ISearchStartedPayload>(
  SEARCH_STARTED
);
export const searchFinished = createAction<ISearchFinishedPayload>(
  SEARCH_FINISHED
);

export const closeSearch = createAction<ICloseSearchPayload>(CLOSE_SEARCH);

export const searchHighlightOffset = createAction<
  ISearchHighlightOffsetPayload
>(SEARCH_HIGHLIGHT_OFFSET);
