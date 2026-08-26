import { Watcher } from "common/util/watcher";

import abortTask from "main/reactors/tasks/abort-task";

import queueGame from "main/reactors/tasks/queue-game";

import queueCaveReinstall from "main/reactors/tasks/queue-cave-reinstall";
import queueCaveUninstall from "main/reactors/tasks/queue-cave-uninstall";
import exploreCave from "main/reactors/tasks/explore-cave";
import abortGame from "main/reactors/tasks/abort-game";
import switchVersionCave from "main/reactors/tasks/switch-version-cave";
import viewCaveDetails from "main/reactors/tasks/view-cave-details";

export default function (watcher: Watcher) {
  abortTask(watcher);

  queueGame(watcher);
  queueCaveReinstall(watcher);
  queueCaveUninstall(watcher);
  exploreCave(watcher);
  abortGame(watcher);
  switchVersionCave(watcher);
  viewCaveDetails(watcher);
}
