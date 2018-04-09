if (process.type !== "browser") {
  throw new Error("main store required from renderer");
}

import {
  createStore,
  applyMiddleware,
  compose,
  GenericStoreEnhancer,
  Middleware,
  MiddlewareAPI,
} from "redux";
import { electronEnhancer } from "ftl-redux-electron-store";

import route from "common/util/route";
import getWatcher from "main/reactors";
import reducer from "common/reducers";

import shouldLogAction from "common/util/should-log-action";

import { IStore } from "common/types";

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

let watcher = getWatcher();

const enhancer = compose(
  electronEnhancer({
    postDispatchCallback: (action: any) => {
      route(watcher, store, action);
    },
  }),
  applyMiddleware(...middleware)
) as GenericStoreEnhancer;

const initialState = {} as any;
const store = createStore(reducer, initialState, enhancer) as IStore;

if (module.hot) {
  module.hot.dispose(() => {
    console.warn(`Refreshing reactors...`);
    const _getWatcher = require("main/reactors").default;
    watcher = _getWatcher();
    return { stopPropagation: true };
  });
}

export default store;
