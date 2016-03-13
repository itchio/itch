
import {takeEvery} from 'redux-saga'
import {put, call, select} from 'redux-saga/effects'
import {delay} from './effects'

import createQueue from './queue'
import {createSelector} from 'reselect'

import {switchPage, sessionReady} from '../actions'
import {SESSION_READY, LOGOUT} from '../constants/action-types'

export function * _logout () {
  yield put(switchPage('gate'))
}

export function * _sessionReady () {
  yield call(delay, 1000)
  yield put(switchPage('hub'))
}

export default function * loginSaga () {
  const queue = createQueue('login')
  const sessionSelector = createSelector(
    (state) => state.setup.done,
    (state) => state.session.credentials.key,
    (setupDone, loginDone) => {
      if (setupDone && loginDone) {
        queue.dispatch(sessionReady())
      }
    }
  )

  yield [
    takeEvery(SESSION_READY, _sessionReady),
    takeEvery(LOGOUT, _logout),
    takeEvery('*', function * () {
      sessionSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}
