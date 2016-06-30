
import {startDownload} from './start-download'
import {queueGame} from './queue-game'
import {taskEnded} from './task-ended'
import {downloadEnded} from './download-ended'
import {queueCaveReinstall} from './queue-cave-reinstall'
import {queueCaveUninstall} from './queue-cave-uninstall'
import {implodeCave} from './implode-cave'
import {exploreCave} from './explore-cave'
import {abortGame} from './abort-game'
import {downloadWatcher} from './download-watcher'
import {abortTask} from './start-task'

async function boot (store, action) {
  await downloadWatcher(store)
}

async function retryDownload (store, action) {
  startDownload(store, action.payload.downloadOpts)
}

export default {
  boot, exploreCave,
  queueGame, queueCaveReinstall, queueCaveUninstall, implodeCave,
  downloadEnded, taskEnded, retryDownload, abortGame, abortTask
}
