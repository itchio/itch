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
const hack = { store: null };

let reduxLoggingEnabled = () =>
  hack.store.getState().status.reduxLoggingEnabled;

const logger = createLogger({
  predicate: (getState: () => any, action: any) => {
    if (!reduxLoggingEnabled()) return false;
    return shouldLogAction(action);
  },
  diff: true,
});
middleware.push(logger);

const enhancers = [syncRenderer, applyMiddleware(...middleware)];

const initialState = {} as any;
hack.store = createStore(
  (state: RootState, action: AnyAction) => {
    const res = reducer(state, action);
    route(watcher, hack.store, action);
    return res;
  },
  initialState,
  compose(...enhancers)
) as ChromeStore;

hack.store.watcher = watcher;

export default hack.store;

(window as any).ReduxStore = hack.store;
