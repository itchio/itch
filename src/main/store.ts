import { getErrorStack } from "common/butlerd/errors";
if (process.type !== "browser") {
  throw new Error("main store required from renderer");
}

import { createStore, applyMiddleware, Middleware, MiddlewareAPI } from "redux";

import { makeRouteMiddleware } from "common/util/route";
import getWatcher from "main/reactors";
import reducer from "common/reducers";

import shouldLogAction from "common/util/should-log-action";

import { Store } from "common/types";
import { mainLogger } from "main/logger";
import { mainSyncMiddleware } from "main/store-sync";

const crashGetter =
  (store: MiddlewareAPI<any>) =>
  (next: (action: any) => any) =>
  (action: any) => {
    try {
      if (action && !action.type) {
        throw new Error(
          `refusing to dispatch action with null type: ${JSON.stringify(
            action
          )}`
        );
      }
      return next(action);
    } catch (e) {
      console.log(
        `Uncaught redux: for action ${action.type}: ${getErrorStack(e)}`
      );
    }
  };

const middleware: Middleware[] = [];
middleware.push(crashGetter);

const beChatty = process.env.MARCO_POLO === "1";

if (beChatty) {
  const createLogger = require("redux-cli-logger").default;
  const logger = createLogger({
    predicate: (getState: () => any, action: any) => {
      return shouldLogAction(action);
    },
    stateTransformer: (state: any) => "",
    actionTransformer: (action: any) => {
      if (/Fetched$/.test(action.type)) {
        return {
          type: action.type,
          payload: { redacted: "true" },
        };
      } else {
        return action;
      }
    },
  });

  middleware.push(logger);
}

let watcher = getWatcher(mainLogger);

middleware.push(mainSyncMiddleware);

const initialState = {} as any;
const store = createStore(
  reducer,
  initialState,
  applyMiddleware(...middleware, makeRouteMiddleware(watcher))
) as Store;

export default store;
