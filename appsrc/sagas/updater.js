
import {EventEmitter} from 'events'
import invariant from 'invariant'

import {takeLatest} from 'redux-saga'
import {fork, take, put, call, select} from 'redux-saga/effects'

import {getUserMarket, getGlobalMarket} from './market'
import {delay} from './effects'

import {checkForGameUpdates} from '../actions'

import fetch from '../util/fetch'
import pathmaker from '../util/pathmaker'

import mklog from '../util/log'
const log = mklog('updater')
import {opts} from '../logger'

import {startDownload} from './tasks/start-download'

import {
  USER_DB_READY,
  CHECK_FOR_GAME_UPDATES
} from '../constants/action-types'

const DELAY_BETWEEN_GAMES = 25

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 30 * 60 * 1000

import findUpload from '../tasks/find-upload'

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

  if (!cave.gameId) {
    log(opts, `Cave lacks gameId, skipping: ${cave.id}`)
    return
  }

  const credentials = yield select((state) => state.session.credentials)
  invariant(credentials, 'has credentials')

  const market = getUserMarket()
  let game
  try {
    game = yield call(fetch.gameLazily, market, credentials, cave.gameId)
  } catch (e) {
    log(opts, `Could not fetch game ${cave.gameId}, skipping (${e.message || e})`)
    return
  }

  const logger = new mklog.Logger({sinks: {console: false, string: true}})

  if (game) {
    log(opts, `Looking for updates to ${game.title}: stub`)
    const out = new EventEmitter()
    const taskOpts = {
      ...opts,
      logger,
      game,
      gameId: game.id,
      credentials,
      downloadKey: cave.downloadKey,
      market
    }

    try {
      const {uploads, downloadKey} = yield call(findUpload, out, taskOpts)
      if (uploads.length === 0) {
        log(opts, `Can't check for updates for ${game.title}, no uploads.`)
        logger.contents.split('\n').map((line) => log(opts, `> ${line}`))
        return
      }
      const upload = uploads[0]

      if (upload.id !== cave.uploadId) {
        log(opts, `Got a new upload for ${game.title}: ${upload.filename}`)
        const archivePath = pathmaker.downloadPath(upload)

        yield call(startDownload, {
          game,
          gameId: game.id,
          upload,
          destPath: archivePath,
          downloadKey,
          reason: 'update'
        })
      }
    } catch (e) {
      log(opts, `While looking for update: `)
    }
  } else {
    log(opts, `Can't check for updates for ${game.title}, not visible by current user?`)
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
