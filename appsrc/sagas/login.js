
import {takeEvery} from 'redux-saga'
import {put, call, select} from 'redux-saga/effects'
import client from '../util/api'

import createQueue from './queue'
import {createSelector} from 'reselect'

import {
  attemptLogin,
  loginFailed,
  loginSucceeded,
  switchPage,
  sessionReady
} from '../actions'

import {
  LOGIN_WITH_PASSWORD,
  SESSION_READY
} from '../constants/action-types'

export function * onPasswordLogin (action) {
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

const delay = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms))

export function * onSessionReady () {
  console.log(`woo, session is ready`)
  yield call(delay, 1000)
  console.log(`switching page...`)
  yield put(switchPage('hub'))
}

export default function * loginSaga () {
  const queue = createQueue('login')
  const sessionSelector = createSelector(
    (state) => state.setup.done,
    (state) => state.session.credentials.key,
    (setupDone, loginDone) => {
      console.log(`setupDone, loginDone `, setupDone, loginDone)
      if (setupDone && loginDone) {
        queue.dispatch(sessionReady())
      }
    }
  )

  yield [
    takeEvery(LOGIN_WITH_PASSWORD, onPasswordLogin),
    takeEvery(SESSION_READY, onSessionReady),
    takeEvery('*', function * watchSession () {
      sessionSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}
