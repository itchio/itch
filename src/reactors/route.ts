import { IStore, Cancelled } from "../types";
import { IAction } from "../constants/action-types";

import { Watcher } from "./watcher";

import env from "../env";
import * as os from "../os";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "route" });

let printError = (msg: string) => {
  logger.error(msg);
};

if (env.name === "test") {
  printError = (msg: string) => {
    console.error(msg);
    console.error("Bailing out...");
    os.exit(1);
  };
}

const emptyArr = [];

function err(e: Error, action: IAction<any>) {
  if (e instanceof Cancelled) {
    console.warn(`reactor for ${action.type} was cancelled`);
  } else {
    printError(
      `while reacting to ${(action || { type: "?" }).type}: ${e.stack || e}`
    );
  }
}

export default async function route(
  watcher: Watcher,
  store: IStore,
  action: IAction<any>
) {
  setTimeout(() => {
    try {
      for (const r of watcher.reactors[action.type] || emptyArr) {
        r(store, action).catch(e => {
          err(e, action);
        });
      }

      for (const r of watcher.reactors._ALL || emptyArr) {
        r(store, action).catch(e => {
          err(e, action);
        });
      }

      for (const sub of watcher.subs) {
        if (!sub) {
          continue;
        }

        for (const r of sub.reactors[action.type] || emptyArr) {
          r(store, action).catch(e => {
            err(e, action);
          });
        }

        for (const r of sub.reactors._ALL || emptyArr) {
          r(store, action).catch(e => {
            err(e, action);
          });
        }
      }
    } catch (e) {
      const e2 = new Error(
        `Could not route action, original stack:\n${e.stack}`
      );
      err(e2, action);
    }
  }, 0);
}
