import reducer from "common/reducers";
import { Action, ChromeStore, RootState, Store } from "common/types";
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
const hack: { store: ChromeStore | null } = { store: null };

let reduxLoggingEnabled = () =>
  hack.store ? hack.store.getState().status.reduxLoggingEnabled : false;

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
const store = createStore(
  (state: RootState | undefined, action: AnyAction) => {
    // redux's own actions (@@INIT etc.) have no payload; ours always do
    const res = reducer(state, action as Action<any>);
    if (hack.store) {
      // hack.store is null only during createStore's own initial
      // @@INIT dispatch
      route(watcher, hack.store, action as Action<any>);
    }
    return res;
  },
  initialState,
  compose(...enhancers)
) as ChromeStore;
hack.store = store;

store.watcher = watcher;

export default store;

(window as any).ReduxStore = store;
