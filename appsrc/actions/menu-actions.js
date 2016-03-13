
import {createAction} from 'redux-actions'

import {
  REFRESH_MENU,
  MENU_ACTION
} from '../constants/action-types'

export const refreshMenu = createAction(REFRESH_MENU)
export const menuAction = createAction(MENU_ACTION)
