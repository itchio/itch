
import {delay} from '../delay'

import {opts} from './log'
import mklog from '../../util/log'
const log = mklog('download-watcher')

const DOWNLOAD_DELAY = 3000

let currentDownload = null

async function updateDownloadState (store) {
  log(opts, 'Sleeping for a bit..')
  await delay(DOWNLOAD_DELAY)

  const downloadsByOrder = store.getState().tasks.downloadsByOrder
  const first = downloadsByOrder[0]
  if (!first) {
    if (currentDownload) {
      log(opts, 'Cancelling/clearing out last download')
      currentDownload = null
    } else {
      log(opts, 'Idle...')
    }
  } else {
    if (currentDownload !== first) {
      log(opts, `${first} is the new first`)
      currentDownload = first
    } else {
      log(opts, `Still downloading ${currentDownload}`)
    }
  }
}

export async function downloadWatcher (store) {
  // FIXME not ready
  while (true && false) {
    try {
      await updateDownloadState(store)
    } catch (e) {
      log(opts, `While updating download state: ${e.stack || e}`)
    }
  }
}
