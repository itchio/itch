if (process.type !== "renderer") {
  throw new Error("chrome store required from metal");
}

import {
  createStore,
  applyMiddleware,
  compose,
  GenericStoreEnhancer,
  Middleware,
} from "redux";
import { electronEnhancer } from "ftl-redux-electron-store";
const createLogger = require("redux-logger");

import route from "../reactors/route";
import { Watcher } from "../reactors/watcher";
import reducer from "../reducers";

const watcher = new Watcher();

import { IChromeStore } from "../types";

const filter = true;
const middleware: Middleware[] = [];

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

if (REDUX_DEVTOOLS_ENABLED) {
  const logger = createLogger({
    predicate: (getState: () => any, action: any) => !action.MONITOR_ACTION,
  });
  middleware.push(logger);
}

const ee = electronEnhancer({
  filter,
  postDispatchCallback: (action: any) => {
    route(watcher, store, action);
  },
}) as GenericStoreEnhancer;

const em = applyMiddleware(...middleware);

let enhancer: GenericStoreEnhancer;

if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require("../components/dev-tools").default;
  enhancer = compose(ee, em, DevTools.instrument());
} else {
  enhancer = compose(ee, em);
}

const initialState = {};
const store = createStore(reducer, initialState, enhancer) as IChromeStore;
route(watcher, store, { type: "__MOUNT", payload: null });

store.watcher = watcher;

export default store;
