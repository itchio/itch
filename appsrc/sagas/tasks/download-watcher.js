
import {delay} from '../effects'
import {call, select} from 'redux-saga/effects'

import {opts} from './log'
import mklog from '../util/logger'
const log = mklog('download-watcher')

const DOWNLOAD_DELAY = 3000

const currentDownload = null

function * updateDownloadState() {
  log(opts, `Sleeping for a bit..`)
  yield call(delay, DOWNLOAD_DELAY)

  const downloadsByPriority = yield select((state) => state.tasks.downloadsByPriority)
  const first = downloadsByPriority[0]
  if (!first) {
    if (currentDownload) {
      log(opts, `Cancelling/clearing out last download`)
      currentDownload = null
    } else {
      log(opts, `Idle...`)
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

export function * downloadWatcher () {
  while (true) {
    try {
      yield call(updateDownloadState)
    } catch (e) {
      log(opts, `While updating download state: ${e.stack || e}`)
    }
  }
}
