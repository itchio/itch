if (process.type === "browser") {
  throw new Error("renderer store required from main");
}

import reducer from "common/reducers";
import { ChromeStore } from "common/types";
import route from "common/util/route";
import shouldLogAction from "common/util/should-log-action";
import { Watcher } from "common/util/watcher";
import { electronEnhancer } from "ftl-redux-electron-store";
import { applyMiddleware, compose, createStore, Middleware } from "redux";
import { rendererLogger } from "renderer/logger";
const { createLogger } = require("redux-logger");

const watcher = new Watcher(rendererLogger);

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

const enhancers = [
  electronEnhancer({
    filter,
    postDispatchCallback: (action: any) => {
      route(watcher, store, action);
    },
  }),
  applyMiddleware(...middleware),
];

const initialState = {} as any;
const store = createStore(
  reducer,
  initialState,
  compose(...enhancers)
) as ChromeStore;

store.watcher = watcher;

export default store;

(window as any).ReduxStore = store;
