
import {createAction} from 'redux-actions'

import {
  REFRESH_MENU
} from '../constants/action-types'

export const refreshMenu = () => (dispatch, getState) => {
  const {session, i18n} = getState()
  const {credentials} = session
  const action = createAction(REFRESH_MENU)({credentials, i18n})
  dispatch(action)
}
