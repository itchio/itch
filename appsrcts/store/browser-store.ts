
import { createStore, applyMiddleware, compose, GenericStoreEnhancer, Store } from "redux";
import { electronEnhancer } from "redux-electron-store";

import route from "../reactors/route";
import reactors from "../reactors";
import reducer from "../reducers";

import {IStore} from "../types/db";

const crashGetter = (store: Store<any>) => (next: (action: any) => any) => (action: any) => {
  try {
    if (action && !action.type) {
      throw new Error(`refusing to dispatch action with null type: ${JSON.stringify(action)}`);
    }
    return next(action);
  } catch (e) {
    /* tslint:disable:no-console */
    console.log(`Uncaught redux: for action ${action.type}: ${e.stack}`);
  }
};

const middleware = [
  crashGetter,
];

const beChatty = process.env.MARCO_POLO === "1";

if (beChatty) {
  const createLogger = require("redux-cli-logger").default;
  const logger = createLogger({
    predicate: (getState: () => any, action: any) => {
      return !action.MONITOR_ACTION &&
        !/^WINDOW_/.test(action.type) &&
        !/_DB_/.test(action.type) &&
        !/LOCALE_/.test(action.type) &&
        !/_FETCHED$/.test(action.type);
    },
    stateTransformer: (state: any) => "",
  });

  middleware.push(logger);
}

const allAction = Object.freeze({ type: "__ALL", payload: null });
const enhancer = compose(
  electronEnhancer({
    postDispatchCallback: (action: any) => {
      route(reactors, store, action);
      route(reactors, store, allAction);
    },
  }),
  applyMiddleware(...middleware)
) as GenericStoreEnhancer;

const initialState = {};
const store = createStore(reducer, initialState, enhancer) as IStore;
route(reactors, store, { type: "__MOUNT", payload: null });

export default store;
