
import {takeEvery} from 'redux-saga'
import {call} from 'redux-saga/effects'

import {startDownload} from './start-download'
import {_queueGame} from './queue-game'
import {_taskEnded} from './task-ended'
import {_downloadEnded} from './download-ended'
import {_queueCaveReinstall} from './queue-cave-reinstall'
import {_queueCaveUninstall} from './queue-cave-uninstall'
import {_exploreCave} from './explore-cave'
import {downloadWatcher} from './download-watcher'

import {
  EXPLORE_CAVE,
  QUEUE_GAME,
  QUEUE_CAVE_REINSTALL,
  QUEUE_CAVE_UNINSTALL,
  DOWNLOAD_ENDED,
  TASK_ENDED,
  RETRY_DOWNLOAD
} from '../../constants/action-types'

export default function * tasksSaga () {
  yield [
    takeEvery(EXPLORE_CAVE, _exploreCave),
    takeEvery(QUEUE_GAME, _queueGame),
    takeEvery(QUEUE_CAVE_REINSTALL, _queueCaveReinstall),
    takeEvery(QUEUE_CAVE_UNINSTALL, _queueCaveUninstall),
    takeEvery(DOWNLOAD_ENDED, _downloadEnded),
    takeEvery(TASK_ENDED, _taskEnded),
    takeEvery(RETRY_DOWNLOAD, (action) => startDownload(action.payload.downloadOpts)),
    call(downloadWatcher)
  ]
}
