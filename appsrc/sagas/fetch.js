
import invariant from 'invariant'

import {getMarket} from './market'

import {takeEvery, takeLatest} from 'redux-saga'
import {select, call, put} from 'redux-saga/effects'
import {delay} from './effects'

import mklog from '../util/log'
const log = mklog('fetch-saga')
import {opts} from '../logger'

import fetch from '../util/fetch'

import {
  searchFetched,
  searchStarted,
  searchFinished
} from '../actions'

import {
  WINDOW_FOCUS_CHANGED,
  LOGIN_SUCCEEDED,
  SEARCH
} from '../constants/action-types'

function * _windowFocusChanged (action) {
  const {focused} = action.payload
  if (!focused) {
    // app just went in the background, nbd
    return
  }

  const credentials = yield select((state) => state.session.credentials)
  if (!credentials.key) {
    log(opts, `Not logged in, not fetching anything yet`)
    return
  }

  yield call(fetchUsuals, credentials)
}

function * _loginSucceeded (action) {
  const credentials = action.payload
  yield call(fetchUsuals, credentials)
}

function * fetchUsuals (credentials) {
  invariant(credentials.key, 'have API key')

  log(opts, `Fetching the usuals`)

  const market = getMarket()

  yield [
    call(fetch.dashboardGames, market, credentials),
    call(fetch.ownedKeys, market, credentials)
  ]
}

function * _search (action) {
  // 200ms debounce
  yield call(delay, 200)

  yield put(searchStarted())

  try {
    const credentials = yield select((state) => state.session.credentials)
    if (!credentials.key) {
      log(opts, `Not logged in, can't search`)
      return
    }

    const query = action.payload
    const results = yield call(fetch.search, credentials, query)

    yield put(searchFetched({results}))
  } catch (e) {
  } finally {
    yield put(searchFinished())
  }
}

export default function * fetchSaga () {
  yield [
    takeEvery(WINDOW_FOCUS_CHANGED, _windowFocusChanged),
    takeEvery(LOGIN_SUCCEEDED, _loginSucceeded),
    takeLatest(SEARCH, _search)
  ]
}
