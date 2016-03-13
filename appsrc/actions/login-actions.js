
import {createAction} from 'redux-actions'

import {
  ATTEMPT_LOGIN,
  LOGIN_WITH_PASSWORD,
  LOGIN_FAILED,
  LOGIN_SUCCEEDED,

  CHANGE_USER,
  LOGOUT
} from '../constants/action-types'

export const attemptLogin = createAction(ATTEMPT_LOGIN)
export const loginWithPassword = createAction(LOGIN_WITH_PASSWORD)
export const loginFailed = createAction(LOGIN_FAILED)
export const loginSucceeded = createAction(LOGIN_SUCCEEDED)

export const changeUser = createAction(CHANGE_USER)
export const logout = createAction(LOGOUT)
