// Vendored from @goosewobbler/electron-redux: pieces shared between the
// main-process middleware, the renderer middleware, and the preload bridge.
// The channels are internal to the app (both ends always ship together).

import type { AnyAction } from "redux";

export const ACTION_CHANNEL = "store-sync.ACTION";
export const FETCH_STATE_CHANNEL = "store-sync.FETCH_STATE";

export interface ElectronReduxBridge {
  getMainState(): Promise<any>;
  subscribeToActions(store: { dispatch: (action: AnyAction) => any }): void;
  sendAction(action: AnyAction): void;
}

const validActionKeys = ["type", "payload", "error", "meta"];

const isPlainObject = (value: any): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

/** Determines if an action has a shape that is safe for forwarding */
export const isFSA = (action: any): boolean =>
  isPlainObject(action) &&
  typeof action.type === "string" &&
  Object.keys(action).every((key) => validActionKeys.includes(key));

/** Returns an equivalent action that will only play in the current process */
export const stopForwarding = (action: AnyAction): AnyAction => ({
  ...action,
  meta: {
    ...action.meta,
    scope: "local",
  },
});

/** True if the action has the right format and isn't scoped locally */
export const validateAction = (action: any): boolean =>
  isFSA(action) && action.meta?.scope !== "local" && !/^@@/.test(action.type);
