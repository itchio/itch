
import {takeEvery} from 'redux-saga'
import {put, call, take} from 'redux-saga/effects'
import client from '../util/api'

import {
  attemptLogin,
  loginFailed,
  loginSucceeded
} from '../actions'

import {
  LOGIN_WITH_PASSWORD,
  LOGIN_SUCCEEDED,
  SETUP_DONE
} from '../constants/action-types'

export function * passwordLogin (action) {
  yield put(attemptLogin())

  try {
    const {username, password} = action.payload
    const loginRes = (yield call([client, client.loginWithPassword], username, password))
    const key = loginRes.key.key
    const keyClient = client.withKey(key)
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed(e.errors || e.stack || e))
  }
}

export function * sessionWatcher () {
  while (true) {
    console.log(`waiting on login & setup`)
    yield [
      take(LOGIN_SUCCEEDED),
      take(SETUP_DONE)
    ]
    console.log(`both login & setup done!`)
  }
}

export default function * loginSaga () {
  yield [
    takeEvery(LOGIN_WITH_PASSWORD, passwordLogin),
    call(sessionWatcher)
  ]
}
