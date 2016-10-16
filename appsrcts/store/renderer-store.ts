
import { createStore, applyMiddleware, compose, GenericStoreEnhancer, Middleware } from "redux";
import { electronEnhancer } from "redux-electron-store";
const createLogger = require("redux-logger");

// import route from '../reactors/route'
// import reactors from '../renderer-reactors'
// import reducer from '../reducers'

const route = require("../reactors/route").default;
const reactors = require("../renderer-reactors").default;
const reducer = require("../reducers").default;

const filter = true;
const middleware: Array<Middleware> = [];

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

if (REDUX_DEVTOOLS_ENABLED) {
  const logger = createLogger({
    predicate: (getState: () => any, action: any) => !action.MONITOR_ACTION,
  });
  middleware.push(logger);
}

const allAction = Object.freeze({ type: "__ALL", payload: null });
const ee = electronEnhancer({
  filter,
  synchronous: false,
  postDispatchCallback: (action: any) => {
    route(reactors, store, action);
    route(reactors, store, allAction);
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
const store = createStore(reducer, initialState, enhancer);
route(reactors, store, { type: "__MOUNT", payload: null });

export default store;
