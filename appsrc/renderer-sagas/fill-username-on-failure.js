
import {takeEvery} from '../sagas/effects'

import {LOGIN_FAILED} from '../constants/action-types'

export function * _loginFailed (action) {
  const {username} = action.payload
  const usernameField = document.querySelector('#login-username')
  if (usernameField) {
    usernameField.value = username
  }
}

export default function * fillUsernameOnFailureSaga () {
  yield [
    takeEvery(LOGIN_FAILED, _loginFailed)
  ]
}
