
import {call} from 'redux-saga/effects'

import {startTask} from './start-task'
import {log, opts} from './log'

export function * _downloadEnded (action) {
  const {downloadOpts} = action.payload
  let {err} = action.payload

  const {reason} = downloadOpts
  if (reason === 'install' || reason === 'update') {
    if (err) {
      log(opts, 'Download had an error, should notify user')
    } else {
      log(opts, 'Download finished, installing..')
      let {err} = yield call(startTask, {
        name: 'install',
        gameId: downloadOpts.gameId,
        game: downloadOpts.game,
        upload: downloadOpts.upload,
        archivePath: downloadOpts.destPath
      })

      if (err) {
        log(opts, `Error in configure: ${err}`)
        return
      }
    }
  } else {
    log(opts, `Downloaded something for reason ${reason}`)
  }
}
