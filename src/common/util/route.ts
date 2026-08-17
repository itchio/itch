import { Store, isCancelled, Action } from "common/types";

import { Watcher } from "common/util/watcher";

import { Logger } from "common/logger";
import { Middleware } from "redux";

const emptyArr = [] as any[];

function err(logger: Logger, e: Error, action: Action<any>) {
  if (isCancelled(e)) {
    console.warn(`reactor for ${action.type} was cancelled`);
  } else {
    const actionName = (action || { type: "?" }).type;
    const errorStack = e.stack || e;
    const msg = `while reacting to ${actionName}: ${errorStack}`;
    logger.error(msg);
  }
}

function route(watcher: Watcher, store: Store, action: Action<any>): void {
  setTimeout(() => {
    let promises = [];

    for (const r of watcher.reactors[action.type] || emptyArr) {
      promises.push(r(store, action));
    }

    for (const sub of watcher.subs) {
      if (!sub) {
        continue;
      }

      for (const r of sub.reactors[action.type] || emptyArr) {
        promises.push(r(store, action));
      }
    }
    Promise.all(promises).catch((e) => err(watcher.logger, e, action));
  }, 0);
  return;
}

// route() defers reactors to a later tick, so they always observe
// committed state regardless of where this sits in the chain.
// Reactors only get dispatch/getState: the cast papers over the rest of
// the Store interface (subscribe etc.), which is undefined here.
export const makeRouteMiddleware =
  (watcher: Watcher): Middleware =>
  (api) =>
  (next) =>
  (action) => {
    const res = next(action);
    route(watcher, api as Store, action as Action<any>);
    return res;
  };

export default route;
