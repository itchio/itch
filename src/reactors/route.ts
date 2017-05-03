
import {IStore} from "../types";
import {IAction} from "../constants/action-types";

import {Watcher} from "./watcher";
import * as bluebird from "bluebird";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("reactors");

// TODO: make this a higher-order function
export default async function route (watcher: Watcher, store: IStore, action: IAction<any>) {
  let promises = [];

  for (const r of (watcher.reactors[action.type] || [])) {
    promises.push((async (reactor) => {
      try {
        await reactor(store, action);
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
      }
    })(r));
  }

  for (const r of (watcher.reactors._ALL || [])) {
    promises.push((async (reactor) => {
      try {
        await reactor(store, action);
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
      }
    })(r));
  }

  for (const sub of watcher.subs) {
    if (!sub) { continue; }

    for (const r of (sub.reactors[action.type] || [])) {
      promises.push((async (reactor) => {
        try {
          await reactor(store, action);
        } catch (e) {
          log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        }
      })(r));
    }

    for (const r of (sub.reactors._ALL || [])) {
      promises.push((async (reactor) => {
        try {
          await reactor(store, action);
        } catch (e) {
          log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        }
      })(r));
    }
  }
  
  await bluebird.all(promises);
}
