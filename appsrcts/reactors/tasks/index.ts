
import {startDownload, queueDownload} from "./start-download";
import {queueGame} from "./queue-game";
import {taskEnded} from "./task-ended";
import {downloadEnded} from "./download-ended";
import {queueCaveReinstall} from "./queue-cave-reinstall";
import {queueCaveUninstall} from "./queue-cave-uninstall";
import {implodeCave} from "./implode-cave";
import {exploreCave} from "./explore-cave";
import {abortGame, abortLastGame} from "./abort-game";
import {downloadWatcher} from "./download-watcher";
import {downloadSpeedWatcher} from "./download-speed-watcher";
import {abortTask} from "./start-task";

import {IStore} from "../../types/db";
import {IAction, IBootPayload, IRetryDownloadPayload} from "../../constants/action-types";

async function boot (store: IStore, action: IAction<IBootPayload>) {
  await Promise.all([
    downloadWatcher(store),
    downloadSpeedWatcher(store),
  ]);
}

async function retryDownload (store: IStore, action: IAction<IRetryDownloadPayload>) {
  startDownload(store, action.payload.downloadOpts);
}

export default {
  boot, exploreCave,
  queueGame, queueCaveReinstall, queueCaveUninstall, implodeCave,
  downloadEnded, taskEnded, retryDownload, abortGame, abortLastGame, abortTask,
  queueDownload,
};
