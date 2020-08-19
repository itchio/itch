import { Store, isCancelled, Action } from "common/types";

import { Watcher } from "common/util/watcher";

import { Logger } from "common/logger";

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

export default route;
