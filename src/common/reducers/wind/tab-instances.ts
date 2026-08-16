import { actions, typeOf } from "common/actions";
import tabReducer, { trimHistory } from "common/reducers/wind/tab-instance";
import { Action, TabInstance, TabInstances } from "common/types";

let initialState = (initialURL?: string): TabInstances => ({
  ["initial-tab"]: tabReducer(
    {
      history: [{ url: initialURL ? initialURL : "itch://new-tab" }],
      currentIndex: 0,
      sleepy: true,
      sequence: 0,
    },
    null
  ),
});

const windOpenedType = typeOf(actions.windOpened);
const tabsRestoredType = typeOf(actions.tabsRestored);
const tabOpenedType = typeOf(actions.tabOpened);
const tabsClosedType = typeOf(actions.tabsClosed);
const loggedOutType = typeOf(actions.loggedOut);

export default function (
  state: TabInstances | undefined,
  action: Action<any>
): TabInstances {
  if (typeof state === "undefined") {
    return initialState();
  }

  if (action) {
    if (action.type === windOpenedType) {
      const { initialURL } =
        action.payload as (typeof actions.windOpened)["payload"];
      return initialState(initialURL);
    }

    if (action.type === tabsRestoredType) {
      const { snapshot } =
        action.payload as (typeof actions.tabsRestored)["payload"];

      let newState: TabInstances = {};

      for (const tabSave of snapshot.items ?? []) {
        if (typeof tabSave !== "object") {
          continue;
        }

        const { id, ...data } = tabSave;
        if (!id) {
          continue;
        }

        let tabState: TabInstance = {
          ...data,
          sleepy: true,
          sequence: 0,
        };
        tabState = trimHistory(tabState);
        tabState = tabReducer(tabState, null);
        newState[id] = tabState;
      }

      return newState;
    }

    if (action.type === tabOpenedType) {
      const { tab } = action.payload as (typeof actions.tabOpened)["payload"];

      let tabState = tabReducer(undefined, null);
      tabState = tabReducer(tabState, action);

      return {
        ...state,
        [tab]: tabState,
      };
    }

    if (action.type === tabsClosedType) {
      const { tabs } = action.payload;
      const newState = { ...state };
      for (const tab of tabs) {
        delete newState[tab];
      }
      return newState;
    }

    if (action.type === loggedOutType) {
      return initialState();
    }

    if (action.payload && action.payload.tab) {
      const { tab } = action.payload;
      let oldTabState = state[tab];
      if (typeof oldTabState !== "undefined") {
        const newTabState = tabReducer(state[tab], action);
        if (oldTabState === newTabState) {
          return state;
        }
        return {
          ...state,
          [tab]: newTabState,
        };
      }
    }

    let newState: TabInstances = {};
    let changed = false;
    for (const k of Object.keys(state)) {
      newState[k] = tabReducer(state[k], action);
      if (state[k] !== newState[k]) {
        changed = true;
      }
    }
    if (changed) {
      return newState;
    }
  }

  return state;
}
