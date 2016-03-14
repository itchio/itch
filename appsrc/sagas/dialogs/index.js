
import changeUser from './change-user'

import {fork} from 'redux-saga/effects'

export default function * dialogsSaga () {
  yield [
    fork(changeUser)
  ]
}
