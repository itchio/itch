
import {createAction} from 'redux-actions'

import {
  DB_COMMIT,
  DB_READY,
  DB_CLOSED
} from '../constants/action-types'

export const dbCommit = createAction(DB_COMMIT)
export const dbReady = createAction(DB_READY)
export const dbClosed = createAction(DB_CLOSED)
