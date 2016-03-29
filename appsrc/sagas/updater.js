
import invariant from 'invariant'

import {takeLatest} from 'redux-saga'
import {fork, take, put, call, select} from 'redux-saga/effects'

import {getUserMarket, getGlobalMarket} from './market'
import {delay} from './effects'

import {checkForGameUpdates} from '../actions'

import fetch from '../util/fetch'

import mklog from '../util/log'
const log = mklog('updater')
import {opts} from '../logger'

import {
  USER_DB_READY,
  CHECK_FOR_GAME_UPDATES
} from '../constants/action-types'

const DELAY_BETWEEN_GAMES = 1000

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 30 * 60 * 1000

function * _checkForGameUpdates () {
  // may be interrupted by a saga cancellation
  const caves = getGlobalMarket().getEntities('caves')
  invariant(caves, 'has caves')

  for (const caveId of Object.keys(caves)) {
    try {
      yield call(checkForGameUpdate, caves[caveId])
    } catch (e) {
      log(opts, `While checking for cave ${caveId} update: ${e.stack || e}`)
    }
    yield call(delay, DELAY_BETWEEN_GAMES)
  }
}

function * checkForGameUpdate (cave) {
  if (!cave.launchable) {
    log(opts, `Cave isn't launchable, skipping: ${cave.id}`)
    return
  }

  invariant(cave.gameId, 'cave has gameId')

  const credentials = yield select((state) => state.session.credentials)
  invariant(credentials, 'has credentials')

  const market = getUserMarket()
  const game = yield call(fetch.gameLazily, market, credentials, cave.gameId)

  if (game) {
    log(opts, `Should check updates for ${game.title}: stub`)
  } else {
    log(opts, `Can't check for updates for ${game}, not visible by current user?`)
  }
}

function * installUpdater () {
  yield take(USER_DB_READY)

  while (true) {
    log(opts, `Regularly scheduled check for game updates...`)
    yield put(checkForGameUpdates())
    yield call(delay, DELAY_BETWEEN_PASSES)
  }
}

export default function * updater () {
  yield [
    fork(installUpdater),
    takeLatest(CHECK_FOR_GAME_UPDATES, _checkForGameUpdates)
  ]
}
