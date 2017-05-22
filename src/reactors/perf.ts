
import {Watcher} from "./watcher";
import * as actions from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child("perf");

import {elapsed} from "../format";

let prebootTime: number;
let bootTime: number;
let loginTime: number;
let pageTime: number;
let done = false;

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    prebootTime = Date.now();
  });

  watcher.on(actions.boot, async (store, action) => {
    bootTime = Date.now();
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    loginTime = Date.now();
  });

  watcher.on(actions.firstUsefulPage, async (store, action) => {
    if (done) {
      return;
    }
    done = true;

    pageTime = Date.now();
    logger.info(`preboot -> boot        = ${elapsed(prebootTime, bootTime)}`);
    logger.info(`boot    -> login       = ${elapsed(bootTime, loginTime)}`);
    logger.info(`login   -> first page  = ${elapsed(loginTime, pageTime)}`);
  });
}
