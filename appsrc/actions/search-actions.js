
import {createAction} from 'redux-actions'

import {
  FOCUS_SEARCH,
  SEARCH_FETCHED,
  CLOSE_SEARCH
} from '../constants/action-types'

export const focusSearch = createAction(FOCUS_SEARCH)
export const searchFetched = createAction(SEARCH_FETCHED)
export const closeSearch = createAction(CLOSE_SEARCH)
