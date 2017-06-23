import { Watcher } from "../watcher";
import { DB } from "../../db";

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
import probeCave from "./probe-cave";
import viewCaveDetails from "./view-cave-details";

export default function(watcher: Watcher, db: DB) {
  startTask(watcher);
  taskEnded(watcher);

  queueGame(watcher, db);

  queueCaveReinstall(watcher);
  queueCaveUninstall(watcher);
  implodeCave(watcher);
  exploreCave(watcher);
  abortGame(watcher);
  nukeCavePrereqs(watcher);
  configureCave(watcher);
  revertCave(watcher);
  healCave(watcher);
  probeCave(watcher);
  viewCaveDetails(watcher);
}
