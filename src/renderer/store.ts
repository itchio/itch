import reducer from "common/reducers";
import { Action, ChromeStore, Store } from "common/types";
import route from "common/util/route";
import shouldLogAction from "common/util/should-log-action";
import { Watcher } from "common/util/watcher";
import { applyMiddleware, createStore, Middleware } from "redux";
import { rendererLogger } from "renderer/logger";
import {
  hydrateFromMainState,
  rendererSyncMiddleware,
  wrapReducer,
} from "renderer/store-sync";

const { createLogger } = require("redux-logger");

const watcher = new Watcher(rendererLogger);

const middleware: Middleware[] = [];

const logger = createLogger({
  predicate: (getState: () => any, action: any) => {
    if (!getState()?.status?.reduxLoggingEnabled) return false;
    return shouldLogAction(action);
  },
  diff: true,
});
middleware.push(logger);
middleware.push(rendererSyncMiddleware);

// innermost so reactors see the already-reduced state
const routeMiddleware: Middleware = (api) => (next) => (action) => {
  const res = next(action);
  route(watcher, api as Store, action as Action<any>);
  return res;
};
middleware.push(routeMiddleware);

const initialState = {} as any;
const store = createStore(
  wrapReducer(reducer),
  initialState,
  applyMiddleware(...middleware)
) as unknown as ChromeStore;

store.watcher = watcher;

hydrateFromMainState(store).catch((e) => {
  rendererLogger.error(`Failed to hydrate state from main: ${e.stack || e}`);
});

export default store;

(window as any).ReduxStore = store;
