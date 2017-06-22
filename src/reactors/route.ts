
import {IStore} from "../types";
import {IAction} from "../constants/action-types";

import {Watcher} from "./watcher";

import env from "../env";
import * as os from "../os";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "route"});

let err = (msg: string) => {
  logger.error(msg);
};

if (env.name === "test") {
  err = (msg: string) => {
    console.error(msg);
    console.error("Bailing out...");
    os.exit(1);
  };
}

const emptyArr = [];

export default async function route (watcher: Watcher, store: IStore, action: IAction<any>) {
  setTimeout(() => {
    try {
      for (const r of (watcher.reactors[action.type] || emptyArr)) {
        r(store, action).catch((e) => {
          err(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        });
      }

      for (const r of (watcher.reactors._ALL || emptyArr)) {
        r(store, action).catch((e) => {
          err(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        });
      }

      for (const sub of watcher.subs) {
        if (!sub) { continue; }

        for (const r of (sub.reactors[action.type] || emptyArr)) {
          r(store, action).catch((e) => {
            err(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
          });
        }

        for (const r of (sub.reactors._ALL || emptyArr)) {
          r(store, action).catch((e) => {
            err(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
          });
        }
      }
    } catch (e) {
      err(`Could not route ${action.type}: ${e.stack}`);
    }
  }, 0);
}
