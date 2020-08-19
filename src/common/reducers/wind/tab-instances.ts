import { actions } from "common/actions";
import tabReducer, { trimHistory } from "common/reducers/wind/tab-instance";
import { Action, TabDataSave, TabInstance, TabInstances } from "common/types";
import { each, omit } from "underscore";

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

const windOpenedType = actions.windOpened({} as any).type;
const tabsRestoredType = actions.tabsRestored({} as any).type;
const tabOpenedType = actions.tabOpened({} as any).type;
const tabsClosedType = actions.tabsClosed({} as any).type;
const loggedOutType = actions.loggedOut({} as any).type;

export default function (state: TabInstances, action: Action<any>) {
  if (typeof state === "undefined") {
    return initialState();
  }

  if (action) {
    if (action.type === windOpenedType) {
      const {
        initialURL,
      } = action.payload as typeof actions.windOpened["payload"];
      return initialState(initialURL);
    }

    if (action.type === tabsRestoredType) {
      const {
        snapshot,
      } = action.payload as typeof actions.tabsRestored["payload"];

      let newState = {};

      each(snapshot.items, (tabSave: TabDataSave) => {
        if (typeof tabSave !== "object") {
          return;
        }

        const { id, ...data } = tabSave;
        if (!id) {
          return;
        }

        let tabState: TabInstance = {
          ...data,
          sleepy: true,
          sequence: 0,
        };
        tabState = trimHistory(tabState);
        tabState = tabReducer(tabState, null);
        newState[id] = tabState;
      });

      return newState;
    }

    if (action.type === tabOpenedType) {
      const { tab } = action.payload as typeof actions.tabOpened["payload"];

      let tabState = tabReducer(undefined, null);
      tabState = tabReducer(tabState, action);

      return {
        ...state,
        [tab]: tabState,
      };
    }

    if (action.type === tabsClosedType) {
      const { tabs } = action.payload;
      return omit(state, ...tabs);
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
