
import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'
import client from '../util/api'

import {attemptLogin, loginFailed, loginSucceeded} from '../actions'

import {LOGIN_WITH_PASSWORD} from '../constants/action-types'

export default function * loginSaga () {
  yield [
    takeEvery(LOGIN_WITH_PASSWORD, onPasswordLogin)
  ]
}

export function * onPasswordLogin (action) {
  yield put(attemptLogin())

  try {
    const {username, password} = action.payload
    const key = yield* getKey(username, password)
    const keyClient = client.withKey(key)

    // validate API key and get user profile in one fell swoop
    const me = (yield call([keyClient, keyClient.me])).user
    yield put(loginSucceeded({key, me}))
  } catch (e) {
    yield put(loginFailed(e.errors || e.stack || e))
  }
}

export function * getKey (username, password) {
  const res = (yield call([client, client.loginWithPassword], username, password))
  return res.key.key
}
