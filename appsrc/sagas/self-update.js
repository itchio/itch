
import createQueue from './queue'
import {app} from '../electron'
import os from '../util/os'
import needle from '../promised/needle'

import env from '../env'
import urls from '../constants/urls'

import {takeEvery} from 'redux-saga'
import {put, call} from 'redux-saga/effects'

import mklog from '../util/log'
const log = mklog('self-update')
import {opts} from '../logger'

import {
  BOOT,
  CHECK_FOR_SELF_UPDATE,
  APPLY_SELF_UPDATE,
  SELF_UPDATE_ERROR
} from '../constants/action-types'

import {
  checkForSelfUpdate,
  selfUpdateError,
  checkingForSelfUpdate,
  selfUpdateAvailable,
  selfUpdateNotAvailable,
  selfUpdateDownloaded
} from '../actions'

let hadErrors = false
let autoUpdater

// 6 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000
// 5 seconds, * 1000 = millis
const QUIET_TIME = 5 * 1000

export function * _boot () {
  const queue = createQueue('self-update')

  try {
    autoUpdater = require('electron').autoUpdater
    autoUpdater.on('error', (ev, err) => {
      hadErrors = true
      queue.dispatch(selfUpdateError(err))
    })
    log(opts, 'Installed!')
  } catch (e) {
    log(opts, `While installing: ${e.message}`)
    autoUpdater = null
    return
  }

  const feedUrl = getFeedURL()
  log(opts, `Update feed: ${feedUrl}`)
  autoUpdater.setFeedURL(feedUrl)

  autoUpdater.on('checking-for-update', () => queue.dispatch(checkingForSelfUpdate()))
  autoUpdater.on('update-available', () => queue.dispatch(selfUpdateAvailable()))
  autoUpdater.on('update-not-available', () => queue.dispatch(selfUpdateNotAvailable()))
  autoUpdater.on('update-downloaded', (ev, releaseNotes, releaseName) => {
    log(opts, `update downloaded, release name: '${releaseName}'`)
    log(opts, `release notes: \n'${releaseNotes}'`)
    queue.dispatch(selfUpdateDownloaded(releaseName))
  })

  setTimeout(() => queue.dispatch(checkForSelfUpdate()), QUIET_TIME)
  setInterval(() => queue.dispatch(checkForSelfUpdate()), UPDATE_INTERVAL)

  yield call(queue.exhaust)
}

export function * _checkForSelfUpdate () {
  log(opts, 'Checking...')
  const uri = getFeedURL()
  const resp = yield call(needle.requestAsync, 'GET', uri, {format: 'json'})

  log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
  if (resp.statusCode === 200) {
    // TODO: this is the spot where we would *not* download updates by default
    // if people disable it.
    if (autoUpdater && !hadErrors) {
      yield put(selfUpdateAvailable({spec: resp.body, downloading: true}))
      autoUpdater.checkForUpdates()
    } else {
      yield put(selfUpdateAvailable({spec: resp.body, downloading: false}))
    }
  } else if (resp.statusCode === 204) {
    yield put(selfUpdateNotAvailable())
  } else {
    yield put(selfUpdateError(`While trying to reach update server: ${resp.status}`))
  }
}

export function * _applySelfUpdate () {
  // FIXME: that's not right
  autoUpdater.checkForUpdates()

  if (!autoUpdater) {
    log(opts, 'not applying self update, got no auto-updater')
    return
  }

  log(opts, 'quitting and installing..')
  autoUpdater.quitAndInstall()
}

function getFeedURL () {
  const base = urls.updateServers[env.channel]
  const platform = os.platform() + '_' + os.arch()
  const version = app.getVersion()
  return `${base}/update/${platform}/${version}`
}

export function * _selfUpdateError (action) {
  const error = action.payload
  log(opts, `Error: ${error}`)
}

export default function * setupSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(CHECK_FOR_SELF_UPDATE, _checkForSelfUpdate),
    takeEvery(APPLY_SELF_UPDATE, _applySelfUpdate),
    takeEvery(SELF_UPDATE_ERROR, _selfUpdateError)
  ]
}
