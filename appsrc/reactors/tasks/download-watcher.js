
import delay from '../delay'

import {opts} from './log'
import mklog from '../../util/log'
const log = mklog('download-watcher')

import {EventEmitter} from 'events'
import {throttle} from 'underline'
import {BrowserWindow} from 'electron'

import {Cancelled} from '../../tasks/errors'
import downloadTask from '../../tasks/download'

import * as actions from '../../actions'

const DOWNLOAD_DELAY = 250

let currentDownload = null
let currentEmitter = null

export async function downloadWatcher (store) {
  while (true) {
    try {
      await updateDownloadState(store)
    } catch (e) {
      log(opts, `While updating download state: ${e.stack || e}`)
    }
  }
}

async function updateDownloadState (store) {
  await delay(DOWNLOAD_DELAY)

  const downloadsState = store.getState().downloads
  if (downloadsState.downloadsPaused) {
    if (currentDownload) {
      cancelCurrent()
    }
    await setProgress(store, -1)
    return
  }

  const activeDownload = downloadsState.activeDownload
  if (activeDownload) {
    if (!currentDownload || currentDownload.id !== activeDownload.id) {
      log(opts, `${activeDownload.id} is the new active download`)
      start(store, activeDownload)
    } else {
      // still downloading currentDownload
    }
  } else {
    if (currentDownload) {
      log(opts, 'Cancelling/clearing out last download')
      cancelCurrent()
    } else {
      // idle
    }
  }
  await setProgress(store, downloadsState.progress)
}

async function setProgress (store, alpha) {
  const id = store.getState().ui.mainWindow.id
  if (id) {
    const window = BrowserWindow.fromId(id)
    if (window) {
      window.setProgressBar(alpha)
    }
  }
}

function cancelCurrent () {
  if (currentEmitter) {
    currentEmitter.emit('cancel')
  }
  currentEmitter = null
  currentDownload = null
}

async function start (store, download) {
  cancelCurrent()
  currentDownload = download
  currentEmitter = new EventEmitter()

  const downloadOpts = download.downloadOpts

  let cancelled = false
  let err
  try {
    currentEmitter.on('progress', ((e) => {
      if (cancelled) {
        return
      }
      store.dispatch(actions.downloadProgress({id: download.id, ...e}))
    })::throttle(250))

    const credentials = store.getState().session.credentials
    const extendedOpts = {
      ...opts,
      ...downloadOpts,
      credentials
    }

    log(opts, 'Starting download...')
    await downloadTask(currentEmitter, extendedOpts)
  } catch (e) {
    log(opts, 'Download threw')
    err = e
  } finally {
    if (err instanceof Cancelled) {
      // all good, but not ended
      log(opts, 'Download cancelled')
      cancelled = true
      return
    }

    err = err ? err.message || err : null
    log(opts, `Download ended, err: ${err || '<none>'}`)
    store.dispatch(actions.downloadEnded({id: download.id, err, downloadOpts}))
  }
  log(opts, 'Download done!')
}
