if (process.type !== "browser") {
  throw new Error("main store required from renderer");
}

import {
  createStore,
  applyMiddleware,
  compose,
  AnyAction,
  Middleware,
  MiddlewareAPI,
} from "redux";

import route from "common/util/route";
import getWatcher from "main/reactors";
import reducer from "common/reducers";

import shouldLogAction from "common/util/should-log-action";

import { RootState, Store } from "common/types";
import { mainLogger } from "main/logger";
import { syncMain } from "@goosewobbler/electron-redux";

const crashGetter = (store: MiddlewareAPI<any>) => (
  next: (action: any) => any
) => (action: any) => {
  try {
    if (action && !action.type) {
      throw new Error(
        `refusing to dispatch action with null type: ${JSON.stringify(action)}`
      );
    }
    return next(action);
  } catch (e) {
    console.log(`Uncaught redux: for action ${action.type}: ${e.stack}`);
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

const initialState = {} as any;
const enhancers = [syncMain, applyMiddleware(...middleware)];

const hack = { store: null };
hack.store = createStore(
  (state: RootState, action: AnyAction) => {
    const res = reducer(state, action);
    route(watcher, hack.store, action);
    return res;
  },
  initialState,
  compose(...enhancers)
) as Store;

export default hack.store;
