
import {createAction} from 'redux-actions'

import {
  GLOBAL_DB_COMMIT,
  GLOBAL_DB_READY,
  GLOBAL_DB_CLOSED,

  USER_DB_COMMIT,
  USER_DB_READY,
  USER_DB_CLOSED
} from '../constants/action-types'

export const globalDbCommit = createAction(GLOBAL_DB_COMMIT)
export const globalDbReady = createAction(GLOBAL_DB_READY)
export const globalDbClosed = createAction(GLOBAL_DB_CLOSED)

export const userDbCommit = createAction(USER_DB_COMMIT)
export const userDbReady = createAction(USER_DB_READY)
export const userDbClosed = createAction(USER_DB_CLOSED)
