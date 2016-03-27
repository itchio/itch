
import changeUser from './change-user'
import uninstall from './uninstall'

import {fork} from 'redux-saga/effects'

export default function * dialogsSaga () {
  yield [
    fork(changeUser),
    fork(uninstall)
  ]
}
