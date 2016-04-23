
import {call} from 'redux-saga/effects'
import invariant from 'invariant'

import {startTask} from './start-task'
import {log, opts} from './log'

export function * _downloadEnded (action) {
  const {downloadOpts} = action.payload
  let {err} = action.payload

  const {reason, incremental} = downloadOpts
  if ((reason === 'install' || reason === 'update') && !incremental) {
    if (err) {
      log(opts, 'Download had an error, should notify user')
    } else {
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
        log(opts, `Error in configure: ${err}`)
        return
      }
    }
  } else {
    log(opts, `Downloaded something for reason ${reason}`)
  }
}
