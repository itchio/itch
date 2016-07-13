
import {createAction} from 'redux-actions'

import {
  FOCUS_SEARCH,
  FOCUS_FILTER,
  CLEAR_FILTERS,
  SEARCH,
  SEARCH_QUERY_CHANGED,
  SEARCH_FETCHED,
  SEARCH_STARTED,
  SEARCH_FINISHED,
  CLOSE_SEARCH,

  FILTER_CHANGED,
  BINARY_FILTER_CHANGED,

  SEARCH_HIGHLIGHT_OFFSET
} from '../constants/action-types'

export const focusSearch = createAction(FOCUS_SEARCH)
export const focusFilter = createAction(FOCUS_FILTER)
export const clearFilters = createAction(CLEAR_FILTERS)
export const search = createAction(SEARCH)
export const searchQueryChanged = createAction(SEARCH_QUERY_CHANGED)
export const searchFetched = createAction(SEARCH_FETCHED)

// ugh
export const searchStarted = createAction(SEARCH_STARTED)
export const searchFinished = createAction(SEARCH_FINISHED)

export const closeSearch = createAction(CLOSE_SEARCH)

export const filterChanged = createAction(FILTER_CHANGED)
export const binaryFilterChanged = createAction(BINARY_FILTER_CHANGED)

export const searchHighlightOffset = createAction(SEARCH_HIGHLIGHT_OFFSET)
