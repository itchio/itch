import reducer from "common/reducers";
import { ChromeStore, RootState, Store } from "common/types";
import route from "common/util/route";
import shouldLogAction from "common/util/should-log-action";
import { Watcher } from "common/util/watcher";
import {
  applyMiddleware,
  compose,
  createStore,
  AnyAction,
  Middleware,
} from "redux";
import { rendererLogger } from "renderer/logger";
import { syncRenderer } from "@goosewobbler/electron-redux/renderer";

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

const watcherMiddleware = (store: Store) => {
  return (next: (AnyAction) => AnyAction) => {
    return (action: AnyAction) => {
      const result = next(action);
      route(watcher, store, action);
      return result;
    };
  };
};
middleware.push(watcherMiddleware);

const enhancers = [syncRenderer, applyMiddleware(...middleware)];

const initialState = {} as any;
const store = createStore(
  reducer,
  initialState,
  compose(...enhancers)
) as ChromeStore;

store.watcher = watcher;

export default store;

(window as any).ReduxStore = store;
