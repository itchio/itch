
import {Watcher} from "../watcher";

import startDownload from "./start-download";
import downloadEnded from "./download-ended";

import startTask from "./start-task";
import taskEnded from "./task-ended";

import queueGame from "./queue-game";

import queueCaveReinstall from "./queue-cave-reinstall";
import queueCaveUninstall from "./queue-cave-uninstall";
import implodeCave from "./implode-cave";
import exploreCave from "./explore-cave";
import abortGame from "./abort-game";
import nukeCavePrereqs from "./nuke-cave-prereqs";
import configureCave from "./configure-cave";
import revertCave from "./revert-cave";
import healCave from "./heal-cave";
import viewCaveDetails from "./view-cave-details";

import downloadWatcher from "./download-watcher";
import downloadSpeedWatcher from "./download-speed-watcher";

export default function (watcher: Watcher) {
  startDownload(watcher);
  downloadEnded(watcher);

  startTask(watcher);
  taskEnded(watcher);

  queueGame(watcher);

  queueCaveReinstall(watcher);
  queueCaveUninstall(watcher);
  implodeCave(watcher);
  exploreCave(watcher);
  abortGame(watcher);
  nukeCavePrereqs(watcher);
  configureCave(watcher);
  revertCave(watcher);
  healCave(watcher);
  viewCaveDetails(watcher);

  downloadWatcher(watcher);
  downloadSpeedWatcher(watcher);
}
