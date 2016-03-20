
import {createAction} from 'redux-actions'

import {
  CHECK_FOR_SELF_UPDATE,
  CHECKING_FOR_SELF_UPDATE,
  SELF_UPDATE_AVAILABLE,
  SELF_UPDATE_NOT_AVAILABLE,
  SELF_UPDATE_ERROR,
  SELF_UPDATE_DOWNLOADED,
  SHOW_AVAILABLE_SELF_UPDATE,
  APPLY_SELF_UPDATE_REQUEST,
  APPLY_SELF_UPDATE,
  DISMISS_STATUS
} from '../constants/action-types'

export const checkForSelfUpdate = createAction(CHECK_FOR_SELF_UPDATE)
export const checkingForSelfUpdate = createAction(CHECKING_FOR_SELF_UPDATE)
export const selfUpdateAvailable = createAction(SELF_UPDATE_AVAILABLE)
export const selfUpdateNotAvailable = createAction(SELF_UPDATE_NOT_AVAILABLE)
export const selfUpdateError = createAction(SELF_UPDATE_ERROR)
export const selfUpdateDownloaded = createAction(SELF_UPDATE_DOWNLOADED)
export const showAvailableSelfUpdate = createAction(SHOW_AVAILABLE_SELF_UPDATE)
export const applySelfUpdateRequest = createAction(APPLY_SELF_UPDATE_REQUEST)
export const applySelfUpdate = createAction(APPLY_SELF_UPDATE)
export const dismissStatus = createAction(DISMISS_STATUS)
