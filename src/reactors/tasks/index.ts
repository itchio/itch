import { Watcher } from "../watcher";
import { DB } from "../../db";

import abortTask from "./abort-task";
import taskEnded from "./task-ended";

import queueGame from "./queue-game";

import queueCaveReinstall from "./queue-cave-reinstall";
import queueCaveUninstall from "./queue-cave-uninstall";
import exploreCave from "./explore-cave";
import abortGame from "./abort-game";
import nukeCavePrereqs from "./nuke-cave-prereqs";
import revertCave from "./revert-cave";
import healCave from "./heal-cave";
import probeCave from "./probe-cave";
import viewCaveDetails from "./view-cave-details";

export default function(watcher: Watcher, db: DB) {
  abortTask(watcher);
  taskEnded(watcher);

  queueGame(watcher, db);

  queueCaveReinstall(watcher, db);
  queueCaveUninstall(watcher, db);
  exploreCave(watcher, db);
  abortGame(watcher);
  nukeCavePrereqs(watcher, db);
  revertCave(watcher, db);
  healCave(watcher, db);
  probeCave(watcher);
  viewCaveDetails(watcher, db);
}
