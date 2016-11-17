
import {IStore} from "../types";
import {IAction} from "../constants/action-types";

import {Watcher} from "./watcher";
import {each} from "underscore";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("reactors");

// TODO: make this a higher-order function
export default function route (watcher: Watcher, store: IStore, action: IAction<any>) {
  each(watcher.reactors[action.type], async (reactor) => {
    try {
      await reactor(store, action);
    } catch (e) {
      log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
    }
  });

  each(watcher.reactors._ALL, async (reactor) => {
    try {
      await reactor(store, action);
    } catch (e) {
      log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
    }
  });

  each(watcher.subs, (sub) => {
    each(sub.reactors[action.type], async (reactor) => {
      try {
        await reactor(store, action);
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
      }
    });

    each(sub.reactors._ALL, async (reactor) => {
      try {
        await reactor(store, action);
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
      }
    });
  });
}
