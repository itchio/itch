import { Watcher } from "common/util/watcher";

import abortTask from "./abort-task";

import queueGame from "./queue-game";

import queueCaveReinstall from "./queue-cave-reinstall";
import queueCaveUninstall from "./queue-cave-uninstall";
import exploreCave from "./explore-cave";
import abortGame from "./abort-game";
import switchVersionCave from "./switch-version-cave";
import probeCave from "./probe-cave";
import viewCaveDetails from "./view-cave-details";

export default function(watcher: Watcher) {
  abortTask(watcher);

  queueGame(watcher);
  queueCaveReinstall(watcher);
  queueCaveUninstall(watcher);
  exploreCave(watcher);
  abortGame(watcher);
  switchVersionCave(watcher);
  probeCave(watcher);
  viewCaveDetails(watcher);
}
