
import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'
import client from '../util/api'

import {
  attemptLogin,
  loginFailed,
  loginSucceeded
} from '../actions'

import {
  LOGIN_WITH_PASSWORD
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

export default function * loginSaga () {
  yield [
    takeEvery(LOGIN_WITH_PASSWORD, passwordLogin)
  ]
}
