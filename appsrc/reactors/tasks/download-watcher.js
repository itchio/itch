
import delay from '../delay'

import {opts} from './log'
import mklog from '../../util/log'
const log = mklog('download-watcher')

import {BrowserWindow} from 'electron'

const DOWNLOAD_DELAY = 1000

let currentDownload = null

async function setProgress (store, alpha) {
  const id = store.getState().ui.mainWindow.id
  if (id) {
    const window = BrowserWindow.fromId(id)
    if (window) {
      window.setProgressBar(alpha)
    }
  }
}

async function updateDownloadState (store) {
  log(opts, 'Sleeping for a bit..')
  await delay(DOWNLOAD_DELAY)

  const downloadsState = store.getState().downloads
  const activeDownload = downloadsState.activeDownload
  if (activeDownload) {
    if (currentDownload !== activeDownload.id) {
      log(opts, `${activeDownload.id} is the new active download`)
      currentDownload = activeDownload.id
    } else {
      log(opts, `Still downloading ${currentDownload}`)
    }
  } else {
    if (currentDownload) {
      log(opts, 'Cancelling/clearing out last download')
      currentDownload = null
    } else {
      log(opts, 'Idle...')
    }
  }
  await setProgress(store, downloadsState.progress)
}

export async function downloadWatcher (store) {
  while (true) {
    try {
      await updateDownloadState(store)
    } catch (e) {
      log(opts, `While updating download state: ${e.stack || e}`)
    }
  }
}
