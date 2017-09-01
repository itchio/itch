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

let reduxLoggingEnabled = () => store.getState().status.reduxLoggingEnabled;

import shouldLogAction from "./should-log-action";

const logger = createLogger({
  predicate: (getState: () => any, action: any) => {
    if (!reduxLoggingEnabled()) return false;
    return shouldLogAction(action);
  },
  diff: true,
});
middleware.push(logger);

const ee = electronEnhancer({
  filter,
  postDispatchCallback: (action: any) => {
    route(watcher, store, action);
  },
}) as GenericStoreEnhancer;

const em = applyMiddleware(...middleware);

let enhancer: GenericStoreEnhancer;

enhancer = compose(ee, em) as GenericStoreEnhancer;

const initialState = {};
const store = createStore(reducer, initialState, enhancer) as IChromeStore;

store.watcher = watcher;

export default store;
