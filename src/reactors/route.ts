
import {IStore} from "../types";
import {IAction} from "../constants/action-types";

import {Watcher} from "./watcher";

import rootLogger from "../logger";
const logger = rootLogger.child("route");

export default async function route (watcher: Watcher, store: IStore, action: IAction<any>) {
  setTimeout(() => {
    try {
      for (const r of (watcher.reactors[action.type] || [])) {
        r(store, action).catch((e) => {
          logger.info(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        });
      }

      for (const r of (watcher.reactors._ALL || [])) {
        r(store, action).catch((e) => {
          logger.info(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
        });
      }

      for (const sub of watcher.subs) {
        if (!sub) { continue; }

        for (const r of (sub.reactors[action.type] || [])) {
          r(store, action).catch((e) => {
            logger.info(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
          });
        }

        for (const r of (sub.reactors._ALL || [])) {
          r(store, action).catch((e) => {
            logger.info(`while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
          });
        }
      }
    } catch (e) {
      // tslint:disable-next-line
      console.log(`Could not route ${action.type}: ${e.stack}`);
    }
  }, 0)
}
