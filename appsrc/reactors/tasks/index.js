
import {startDownload} from './start-download'
import {queueGame} from './queue-game'
import {taskEnded} from './task-ended'
import {downloadEnded} from './download-ended'
import {queueCaveReinstall} from './queue-cave-reinstall'
import {queueCaveUninstall} from './queue-cave-uninstall'
import {implodeCave} from './implode-cave'
import {exploreCave} from './explore-cave'
import {downloadWatcher} from './download-watcher'

async function boot (store, action) {
  await downloadWatcher(store)
}

async function retryDownload (store, action) {
  startDownload(store, action.payload.downloadOpts)
}

export default {
  boot, exploreCave,
  queueGame, queueCaveReinstall, queueCaveUninstall, implodeCave,
  downloadEnded, taskEnded, retryDownload
}
