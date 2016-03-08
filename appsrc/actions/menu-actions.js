
import {createAction} from 'redux-actions'

import {
  REFRESH_MENU,
  MENU_ACTION
} from '../constants/action-types'

export const refreshMenu = () => (dispatch, getState) => {
  const {system, session} = getState()
  const {credentials} = session
  const action = createAction(REFRESH_MENU)({system, credentials})
  dispatch(action)
}

export const menuAction = createAction(MENU_ACTION)
