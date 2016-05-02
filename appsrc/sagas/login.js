
import {takeEvery} from './effects'
import {put, call} from 'redux-saga/effects'
import client from '../util/api'

import {
  attemptLogin,
  loginFailed, loginSucceeded
} from '../actions'

import {
  LOGIN_WITH_PASSWORD,
  LOGIN_WITH_TOKEN
} from '../constants/action-types'

export function * _loginWithPassword (action) {
  const {username, password} = action.payload

  yield put(attemptLogin())

  try {
    const key = yield * getKey(username, password)
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed({username, errors: e.errors || e.stack || e}))
  }
}

export function * _loginWithToken (action) {
  const {username, key} = action.payload

  yield put(attemptLogin())

  try {
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    const {me} = action.payload
    if (me && e.code === 'ENOTFOUND') {
      yield put(loginSucceeded({key, me}))
    } else {
      yield put(loginFailed({username, errors: e.errors || e.stack || e}))
    }
  }
}

export function * getKey (username, password) {
  const res = (yield call([client, client.loginWithPassword], username, password))
  return res.key.key
}

export default function * loginSaga () {
  yield [
    takeEvery(LOGIN_WITH_PASSWORD, _loginWithPassword),
    takeEvery(LOGIN_WITH_TOKEN, _loginWithToken)
  ]
}
