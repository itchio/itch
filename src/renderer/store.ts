import reducer from "common/reducers";
import { ChromeStore } from "common/types";
import { makeRouteMiddleware } from "common/util/route";
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

const initialState = {} as any;
const store = createStore(
  wrapReducer(reducer),
  initialState,
  applyMiddleware(...middleware, makeRouteMiddleware(watcher))
) as unknown as ChromeStore;

store.watcher = watcher;

export const hydrated = hydrateFromMainState(store);
hydrated.catch((e) => {
  rendererLogger.error(`Failed to hydrate state from main: ${e.stack || e}`);
});

export default store;

(window as any).ReduxStore = store;
