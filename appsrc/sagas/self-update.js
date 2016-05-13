
import createQueue from './queue'
import {app} from '../electron'
import os from '../util/os'
import needle from '../promised/needle'

const linux = os.itchPlatform() === 'linux'

import env from '../env'
import urls from '../constants/urls'

import {takeEvery} from './effects'
import {put, call, select} from 'redux-saga/effects'
import {delay} from './effects'

import mklog from '../util/log'
const log = mklog('self-update')
import {opts} from '../logger'
import format, {DATE_FORMAT} from '../util/format'

import {
  BOOT,
  CHECK_FOR_SELF_UPDATE,
  APPLY_SELF_UPDATE_REQUEST,
  APPLY_SELF_UPDATE,
  SELF_UPDATE_ERROR,
  SHOW_AVAILABLE_SELF_UPDATE
} from '../constants/action-types'

import {
  checkForSelfUpdate,
  applySelfUpdate,
  snoozeSelfUpdate,
  selfUpdateError,
  checkingForSelfUpdate,
  selfUpdateAvailable,
  selfUpdateNotAvailable,
  selfUpdateDownloaded,
  dismissStatus,
  prepareQuit,
  openModal,
  openUrl
} from '../actions'

let hadErrors = false
let autoUpdater

// 6 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000

// 5 seconds, * 1000 = millis
const DISMISS_TIME = 5 * 1000

const QUIET_TIME = 2 * 1000

const CHECK_FOR_SELF_UPDATES = env.name === 'production' || process.env.UP_TO_SCRATCH === '1'

export function * _boot () {
  if (!CHECK_FOR_SELF_UPDATES) {
    return
  }

  const queue = createQueue('self-update')

  try {
    autoUpdater = require('electron').autoUpdater
    autoUpdater.on('error', (ev, err) => {
      hadErrors = true
      if (/^Could not get code signature/.test(err) && env.name === 'development') {
        // electron-prebuilt isn't signed, we know you can't work Squirrel.mac, don't worry
        log(opts, 'Ignoring Squirrel.mac complaint')
      } else {
        queue.dispatch(selfUpdateError(err))
      }
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
  autoUpdater.on('update-not-available', () => queue.dispatch(selfUpdateNotAvailable({uptodate: true})))
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

  try {
    const resp = yield call(needle.requestAsync, 'GET', uri, {format: 'json'})

    log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
    if (resp.statusCode === 200) {
      const downloadSelfUpdates = yield select((state) => state.preferences.downloadSelfUpdates)

      if (autoUpdater && !hadErrors && downloadSelfUpdates && !linux) {
        yield put(selfUpdateAvailable({spec: resp.body, downloading: true}))
        autoUpdater.checkForUpdates()
      } else {
        yield put(selfUpdateAvailable({spec: resp.body, downloading: false}))
      }
    } else if (resp.statusCode === 204) {
      yield put(selfUpdateNotAvailable({uptodate: true}))
      yield call(delay, DISMISS_TIME)
      yield put(dismissStatus())
    } else {
      yield put(selfUpdateError(`While trying to reach update server: ${resp.status}`))
    }
  } catch (e) {
    if (e.code === 'ENOTFOUND') {
      log(opts, 'Seems like we have no network connectivity, skipping self-update check')
      yield put(selfUpdateNotAvailable({uptodate: false}))
    } else {
      throw e
    }
  }
}

export function * _applySelfUpdateRequest () {
  const spec = yield select((state) => state.selfUpdate.downloaded)
  if (!spec) {
    log(opts, 'Asked to apply update, but nothing downloaded? bailing out...')
    return
  }

  const pubDate = new Date(Date.parse(spec.pub_date))

  yield put(openModal({
    title: ['prompt.self_update_ready.title', {version: spec.name}],
    message: ['prompt.self_update_ready.message'],
    detail: ['prompt.self_update_ready.detail', {notes: spec.notes, pubDate: format.date(pubDate, DATE_FORMAT)}],
    buttons: [
      {
        label: ['prompt.self_update_ready.action.restart'],
        action: applySelfUpdate(),
        icon: 'repeat'
      },
      {
        label: ['prompt.self_update_ready.action.snooze'],
        action: snoozeSelfUpdate(),
        className: 'secondary'
      }
    ]
  }))
}

export function * _applySelfUpdate () {
  if (!autoUpdater) {
    log(opts, 'not applying self update, got no auto-updater')
    return
  }

  log(opts, 'Preparing for restart...')
  yield put(prepareQuit())

  yield call(delay, 400)

  log(opts, 'Handing off to Squirrel')
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

export function * _showAvailableSelfUpdate (action) {
  const spec = yield select((state) => state.selfUpdate.available)
  if (!spec) {
    log(opts, 'Asked to show available self-update but there wasn\'t any')
    yield put(dismissStatus())
    return
  }
  const pubDate = new Date(Date.parse(spec.pub_date))

  const messageString = `prompt.self_update.message.${os.itchPlatform()}`

  yield put(openModal({
    title: ['prompt.self_update.title', {version: spec.name}],
    message: [messageString],
    detail: ['prompt.self_update.detail', {notes: spec.notes, pubDate: format.date(pubDate, DATE_FORMAT)}],
    buttons: [
      {
        label: ['prompt.self_update.action.download'],
        action: [
          openUrl(spec.url),
          dismissStatus()
        ],
        icon: 'download'
      },
      {
        label: ['prompt.self_update.action.view'],
        action: [
          openUrl(urls.releasesPage),
          dismissStatus()
        ],
        className: 'secondary',
        icon: 'earth'
      },
      {
        label: ['prompt.self_update.action.dismiss'],
        action: dismissStatus(),
        className: 'secondary'
      }
    ]
  }))
}

export default function * setupSaga () {
  yield [
    takeEvery(BOOT, _boot),
    takeEvery(CHECK_FOR_SELF_UPDATE, _checkForSelfUpdate),
    takeEvery(APPLY_SELF_UPDATE_REQUEST, _applySelfUpdateRequest),
    takeEvery(APPLY_SELF_UPDATE, _applySelfUpdate),
    takeEvery(SELF_UPDATE_ERROR, _selfUpdateError),
    takeEvery(SHOW_AVAILABLE_SELF_UPDATE, _showAvailableSelfUpdate)
  ]
}
