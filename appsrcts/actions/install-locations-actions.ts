
import {createAction} from 'redux-actions'

import {
  BROWSE_INSTALL_LOCATION,
  ADD_INSTALL_LOCATION_REQUEST,
  ADD_INSTALL_LOCATION,
  REMOVE_INSTALL_LOCATION_REQUEST,
  REMOVE_INSTALL_LOCATION,
  MAKE_INSTALL_LOCATION_DEFAULT,
  QUERY_FREE_SPACE,
  FREE_SPACE_UPDATED
} from '../constants/action-types'

export const browseInstallLocation = createAction(BROWSE_INSTALL_LOCATION)
export const addInstallLocationRequest = createAction(ADD_INSTALL_LOCATION_REQUEST)
export const addInstallLocation = createAction(ADD_INSTALL_LOCATION)
export const removeInstallLocationRequest = createAction(REMOVE_INSTALL_LOCATION_REQUEST)
export const removeInstallLocation = createAction(REMOVE_INSTALL_LOCATION)
export const makeInstallLocationDefault = createAction(MAKE_INSTALL_LOCATION_DEFAULT)
export const queryFreeSpace = createAction(QUERY_FREE_SPACE)
export const freeSpaceUpdated = createAction(FREE_SPACE_UPDATED)
