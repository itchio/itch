if (process.type === "browser") {
  throw new Error("renderer store required from main");
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

import route from "common/util/route";
import { Watcher } from "common/util/watcher";
import reducer from "common/reducers";
import shouldLogAction from "common/util/should-log-action";

const watcher = new Watcher();

import { ChromeStore } from "common/types";

const filter = true;
const middleware: Middleware[] = [];

let reduxLoggingEnabled = () => store.getState().status.reduxLoggingEnabled;

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

enhancer = compose(
  ee,
  em
) as GenericStoreEnhancer;

const initialState = {} as any;
const store = createStore(reducer, initialState, enhancer) as ChromeStore;

store.watcher = watcher;

export default store;

(window as any).ReduxStore = store;
