if (process.type !== "browser") {
  throw new Error("metal store required from chrome");
}

import {
  createStore,
  applyMiddleware,
  compose,
  GenericStoreEnhancer,
  Store,
} from "redux";
import { electronEnhancer } from "ftl-redux-electron-store";

import route from "../reactors/route";
import getWatcher from "../reactors";
import reducer from "../reducers";

import shouldLogAction from "./should-log-action";

import { IStore } from "../types";

const crashGetter = (store: Store<any>) => (next: (action: any) => any) => (
  action: any
) => {
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

const middleware = [crashGetter];

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

const initialState = {};
const store = createStore(reducer, initialState, enhancer) as IStore;

if (module.hot) {
  module.hot.accept(() => {
    console.warn(`Refreshing all reactors...`);
    const _getWatcher = require("../reactors").default;
    watcher = _getWatcher();
  });
}

export default store;
