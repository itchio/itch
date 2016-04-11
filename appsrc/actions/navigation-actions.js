
import {createAction} from 'redux-actions'

import {
  NAVIGATE,
  CLOSE_TAB,
  SHOW_PREVIOUS_TAB,
  SHOW_NEXT_TAB,
  SWITCH_PAGE,

  TAB_CHANGED,
  TAB_DATA_FETCHED,

  OPEN_URL,

  OPEN_PREFERENCES,
  VIEW_CREATOR_PROFILE,
  VIEW_COMMUNITY_PROFILE,

  REPORT_ISSUE
} from '../constants/action-types'

export const navigate = createAction(NAVIGATE)
export const closeTab = createAction(CLOSE_TAB)
export const showPreviousTab = createAction(SHOW_PREVIOUS_TAB)
export const showNextTab = createAction(SHOW_NEXT_TAB)
export const switchPage = createAction(SWITCH_PAGE)

export const tabChanged = createAction(TAB_CHANGED)
export const tabDataFetched = createAction(TAB_DATA_FETCHED)

export const openUrl = createAction(OPEN_URL)

export const openPreferences = createAction(OPEN_PREFERENCES)
export const viewCreatorProfile = createAction(VIEW_CREATOR_PROFILE)
export const viewCommunityProfile = createAction(VIEW_COMMUNITY_PROFILE)

export const reportIssue = createAction(REPORT_ISSUE)
