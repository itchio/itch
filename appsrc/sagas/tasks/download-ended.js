
import {call} from 'redux-saga/effects'
import invariant from 'invariant'

import {startTask} from './start-task'
import {startDownload} from './start-download'
import {log, opts} from './log'

import {omit} from 'underline'

export function * _downloadEnded (action) {
  const {downloadOpts} = action.payload
  let {err} = action.payload

  const {reason, incremental} = downloadOpts
  if (reason === 'install' || reason === 'update') {
    if (err) {
      if (incremental) {
        log(opts, `Incremental didn't work, doing full download`)
        const newDownloadOpts = {
          ...downloadOpts::omit('upgradePath', 'incremental'),
          totalSize: downloadOpts.upload.size
        }
        yield call(startDownload, newDownloadOpts)
      } else {
        log(opts, 'Download had an error, should notify user')
      }
    } else {
      if (incremental) {
        // all good
        return
      }
      log(opts, 'Download finished, installing..')

      const {gameId} = downloadOpts
      invariant(typeof gameId === 'number', 'download has game id')

      const taskOpts = {
        name: 'install',
        gameId: downloadOpts.gameId,
        game: downloadOpts.game,
        upload: downloadOpts.upload,
        archivePath: downloadOpts.destPath
      }

      let {err} = yield call(startTask, taskOpts)

      if (err) {
        log(opts, `Error in install: ${err}`)
        return
      }
    }
  } else {
    log(opts, `Downloaded something for reason ${reason}`)
  }
}
