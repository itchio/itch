
import {createAction} from 'redux-actions'

import {
  OPERATION_FAILED
} from '../constants/action-types'

export const operationFailed = createAction(OPERATION_FAILED)
