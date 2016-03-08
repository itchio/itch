
import {take} from 'redux-saga/effects'

import {
  LOGIN_WITH_PASSWORD
} from '../constants/action-types'

export default function * loginSaga () {
  console.log(`login saga is here!`)
  while (true) {
    yield take(LOGIN_WITH_PASSWORD)
    console.log(`login saga should do its thing!`)
  }
}
