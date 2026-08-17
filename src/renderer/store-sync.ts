// Vendored from @goosewobbler/electron-redux (syncRenderer), split into plain
// middleware, a reducer wrapper, and an explicit post-createStore hydration
// step. Talks to the bridge installed by the preload script.

import { AnyAction, Middleware, Store } from "redux";
import { ElectronReduxBridge, validateAction } from "common/util/store-sync";
import { rendererLogger } from "renderer/logger";

declare global {
  const __ElectronReduxBridge: ElectronReduxBridge;
}

const REPLACE_STATE = "store-sync.REPLACE_STATE";

// scope "local" so the hydration action is never forwarded back to main
const replaceState = (state: any): AnyAction => ({
  type: REPLACE_STATE,
  payload: state,
  meta: { scope: "local" },
});

export const wrapReducer =
  <S, A extends AnyAction>(reducer: (state: S | undefined, action: A) => S) =>
  (state: S | undefined, action: A): S => {
    if (action.type === REPLACE_STATE) {
      return action.payload;
    }
    return reducer(state, action);
  };

export const rendererSyncMiddleware: Middleware = (api) => {
  if (typeof __ElectronReduxBridge === "undefined") {
    throw new Error(
      "store-sync bridge not found. Was this window opened without the inject-preload script?"
    );
  }
  __ElectronReduxBridge.subscribeToActions(api);
  return (next) => (action) => {
    // reduce first: a send that throws (e.g. unclonable payload) must
    // not keep the action from being applied locally
    const res = next(action);
    if (validateAction(action)) {
      try {
        __ElectronReduxBridge.sendAction(action);
      } catch (e) {
        rendererLogger.warn(`Could not forward ${action.type} to main: ${e}`);
      }
    }
    return res;
  };
};

export async function hydrateFromMainState(store: Store<any>): Promise<void> {
  const mainState = await __ElectronReduxBridge.getMainState();
  store.dispatch(replaceState(mainState));
}
