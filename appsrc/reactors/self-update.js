
import {app} from '../electron'
import os from '../util/os'
import needle from '../promised/needle'

import delay from './delay'

import env from '../env'
import urls from '../constants/urls'

import mklog from '../util/log'
const log = mklog('reactors/self-update')
import {opts} from '../logger'
import format, {DATE_FORMAT} from '../util/format'

import * as actions from '../actions'

const linux = os.itchPlatform() === 'linux'

let hadErrors = false
let autoUpdater

// 6 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000

// 5 seconds, * 1000 = millis
const DISMISS_TIME = 5 * 1000

const QUIET_TIME = 2 * 1000

const CHECK_FOR_SELF_UPDATES = env.name === 'production' || process.env.UP_TO_SCRATCH === '1'

async function windowReady (store, action) {
  if (!CHECK_FOR_SELF_UPDATES) {
    return
  }

  try {
    autoUpdater = require('electron').autoUpdater
    autoUpdater.on('error', (ev, err) => {
      hadErrors = true
      const environmentSetManually = !!process.env.NODE_ENV
      if (/^Could not get code signature/.test(err) && (env.name === 'development' || environmentSetManually)) {
        // electron-prebuilt isn't signed, we know you can't work Squirrel.mac, don't worry
        log(opts, 'Ignoring Squirrel.mac complaint')
      } else {
        store.dispatch(actions.selfUpdateError(err))
      }
    })
    log(opts, 'Installed!')
  } catch (e) {
    log(opts, `While installing: ${e.message}`)
    autoUpdater = null
    return
  }

  const feedUrl = await getFeedURL()
  log(opts, `Update feed: ${feedUrl}`)
  autoUpdater.setFeedURL(feedUrl)

  autoUpdater.on('checking-for-update', () => store.dispatch(actions.checkingForSelfUpdate()))
  autoUpdater.on('update-available', () => store.dispatch(actions.selfUpdateAvailable()))
  autoUpdater.on('update-not-available', () => store.dispatch(actions.selfUpdateNotAvailable({uptodate: true})))
  autoUpdater.on('update-downloaded', (ev, releaseNotes, releaseName) => {
    log(opts, `update downloaded, release name: '${releaseName}'`)
    log(opts, `release notes: \n'${releaseNotes}'`)
    store.dispatch(actions.selfUpdateDownloaded(releaseName))
  })

  setTimeout(() => store.dispatch(actions.checkForSelfUpdate()), QUIET_TIME)
  setInterval(() => store.dispatch(actions.checkForSelfUpdate()), UPDATE_INTERVAL)
}

async function checkForSelfUpdate (store, action) {
  log(opts, 'Checking...')
  const uri = await getFeedURL()

  try {
    const resp = await needle.requestAsync('GET', uri, {format: 'json'})

    log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
    if (resp.statusCode === 200) {
      const downloadSelfUpdates = store.getState().preferences.downloadSelfUpdates

      if (autoUpdater && !hadErrors && downloadSelfUpdates && !linux) {
        store.dispatch(actions.selfUpdateAvailable({spec: resp.body, downloading: true}))
        autoUpdater.checkForUpdates()
      } else {
        store.dispatch(actions.selfUpdateAvailable({spec: resp.body, downloading: false}))
      }
    } else if (resp.statusCode === 204) {
      store.dispatch(actions.selfUpdateNotAvailable({uptodate: true}))
      await delay(DISMISS_TIME)
      store.dispatch(actions.dismissStatus())
    } else {
      store.dispatch(actions.selfUpdateError(`While trying to reach update server: ${resp.status}`))
    }
  } catch (e) {
    if (e.code === 'ENOTFOUND') {
      log(opts, 'Seems like we have no network connectivity, skipping self-update check')
      store.dispatch(actions.selfUpdateNotAvailable({uptodate: false}))
    } else {
      throw e
    }
  }
}

async function applySelfUpdateRequest (store, action) {
  const lang = store.getState().i18n.lang
  const spec = store.getState().selfUpdate.downloaded
  if (!spec) {
    log(opts, 'Asked to apply update, but nothing downloaded? bailing out...')
    return
  }

  const pubDate = new Date(Date.parse(spec.pub_date))

  store.dispatch(actions.openModal({
    title: ['prompt.self_update_ready.title', {version: spec.name}],
    message: ['prompt.self_update_ready.message'],
    detail: ['prompt.self_update_ready.detail', {notes: spec.notes, pubDate: format.date(pubDate, DATE_FORMAT, lang)}],
    buttons: [
      {
        label: ['prompt.self_update_ready.action.restart'],
        action: actions.applySelfUpdate(),
        icon: 'repeat'
      },
      {
        label: ['prompt.self_update_ready.action.snooze'],
        action: actions.snoozeSelfUpdate(),
        className: 'secondary'
      }
    ]
  }))
}

async function applySelfUpdate (store, action) {
  if (!autoUpdater) {
    log(opts, 'not applying self update, got no auto-updater')
    return
  }

  log(opts, 'Preparing for restart...')
  store.dispatch(actions.prepareQuit())

  // good job past me, that's top quality code!
  // if only you left a comment explaining why this is necessary..
  await delay(400)

  log(opts, 'Handing off to Squirrel')
  autoUpdater.quitAndInstall()
}

async function returnsZero (cmd) {
  return new Promise((resolve, reject) => {
    require('child_process').exec(cmd, {}, (err, stdout, stderr) => {
      if (err) resolve(false)
      else resolve(true)
    })
  })
}

async function augmentedPlatform () {
  let platform = os.platform()
  if (platform === 'linux') {
    if (await returnsZero('/usr/bin/rpm -q -f /usr/bin/rpm')) {
      platform = 'rpm'
    } else if (await returnsZero('/usr/bin/dpkg --search /usr/bin/dpkg')) {
      platform = 'deb'
    }
  }
  return platform
}

async function getFeedURL () {
  const base = urls.updateServers[env.channel]
  const platform = (await augmentedPlatform()) + '_' + os.arch()
  const version = app.getVersion()
  return `${base}/update/${platform}/${version}`
}

async function selfUpdateError (store, action) {
  const error = action.payload
  log(opts, `Error: ${error}`)
}

async function showAvailableSelfUpdate (store, action) {
  const spec = store.getState().selfUpdate.available
  if (!spec) {
    log(opts, 'Asked to show available self-update but there wasn\'t any')
    store.dispatch(actions.dismissStatus())
    return
  }
  const pubDate = new Date(Date.parse(spec.pub_date))
  const lang = store.getState().i18n.lang

  const messageString = `prompt.self_update.message.${os.itchPlatform()}`

  store.dispatch(actions.openModal({
    title: ['prompt.self_update.title', {version: spec.name}],
    message: [messageString],
    detail: ['prompt.self_update.detail', {notes: spec.notes, pubDate: format.date(pubDate, DATE_FORMAT, lang)}],
    buttons: [
      {
        label: ['prompt.self_update.action.download'],
        action: [
          actions.openUrl(spec.url),
          actions.dismissStatus()
        ],
        icon: 'download'
      },
      {
        label: ['prompt.self_update.action.view'],
        action: [
          actions.openUrl(urls.releasesPage),
          actions.dismissStatus()
        ],
        className: 'secondary',
        icon: 'earth'
      },
      {
        label: ['prompt.self_update.action.dismiss'],
        action: actions.dismissStatus(),
        className: 'secondary'
      }
    ]
  }))
}

export default {
  windowReady, checkForSelfUpdate, applySelfUpdateRequest, applySelfUpdate,
  selfUpdateError, showAvailableSelfUpdate
}
