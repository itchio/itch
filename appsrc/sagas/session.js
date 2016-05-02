
import {takeEvery} from './effects'
import {put, call, select} from 'redux-saga/effects'
import {delay} from './effects'

import createQueue from './queue'
import {createSelector} from 'reselect'

import {switchPage, sessionReady, unlockTab} from '../actions'
import {SESSION_READY, LOGOUT} from '../constants/action-types'

export function * _logout () {
  yield put(switchPage('gate'))
}

export function * _sessionReady () {
  const me = yield select((state) => state.session.credentials.me)
  if (me.developer) {
    yield put(unlockTab({path: 'dashboard'}))
  }
  if (me.pressUser) {
    yield put(unlockTab({path: 'press'}))
  }

  yield call(delay, 1000)
  yield put(switchPage('hub'))
}

export default function * sessionSaga () {
  const queue = createQueue('login')
  const sessionSelector = createSelector(
    (state) => state.setup.done,
    (state) => state.market.ready,
    (state) => state.session.credentials.key,
    (setupDone, marketReady, loginDone) => {
      if (setupDone && marketReady && loginDone) {
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
