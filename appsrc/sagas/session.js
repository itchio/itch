
import {takeEvery} from 'redux-saga'
import {put, call, select} from 'redux-saga/effects'
import {delay} from './effects'

import createQueue from './queue'
import {createSelector} from 'reselect'

import {switchPage, sessionReady} from '../actions'
import {SESSION_READY} from '../constants/action-types'

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
    takeEvery(SESSION_READY, onSessionReady),
    takeEvery('*', function * () {
      sessionSelector(yield select())
    }),
    call(queue.exhaust)
  ]
}

export function * onSessionReady () {
  yield call(delay, 1000)
  yield put(switchPage('hub'))
}
