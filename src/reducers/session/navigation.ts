import { map, reject, omit, filter } from "underscore";

import { ISessionNavigationState, ITabDataSave } from "../../types";

import * as actions from "../../actions";
import reducer from "../reducer";

import { arrayMove } from "react-sortable-hoc";

const baseTabs = ["featured", "library", "collections"];

const initialState = {
  page: "gate",
  tabs: {
    constant: baseTabs,
    transient: [],
  },
  loadingTabs: {},
  lastConstant: "featured",
  tab: "featured",
} as ISessionNavigationState;

export default reducer<ISessionNavigationState>(initialState, on => {
  on(actions.tabLoading, (state, action) => {
    const { tab, loading } = action.payload;
    if (loading) {
      return {
        ...state,
        loadingTabs: {
          ...state.loadingTabs,
          [tab]: true,
        },
      };
    } else {
      return {
        ...state,
        loadingTabs: omit(state.loadingTabs, tab),
      };
    }
  });

  on(actions.tabChanged, (state, action) => {
    const { constant } = state.tabs;
    const { tab } = action.payload;

    if (!tab) {
      return state;
    }

    if (constant.indexOf(tab) === -1) {
      return state;
    }

    return {
      ...state,
      lastConstant: tab,
    };
  });

  on(actions.switchPage, (state, action) => {
    const { page } = action.payload;
    return {
      ...state,
      page,
    };
  });

  on(actions.openTab, (state, action) => {
    const { tab, background } = action.payload;
    const { constant, transient } = state.tabs;

    return {
      ...state,
      tab: background ? state.tab : tab,
      tabs: {
        constant,
        transient: [tab, ...transient],
      },
    };
  });

  on(actions.focusTab, (state, action) => {
    const { tab } = action.payload;

    return {
      ...state,
      tab,
    };
  });

  on(actions.moveTab, (state, action) => {
    const { before, after } = action.payload;

    const { tabs } = state;
    const { transient } = tabs;

    const newTransient = arrayMove(transient, before, after);

    return {
      ...state,
      tabs: {
        ...state.tabs,
        transient: newTransient,
      },
    };
  });

  on(actions.closeTab, (state, action) => {
    const { tab, tabs } = state;
    const closeId = action.payload.tab || tab;
    const { constant, transient } = tabs;

    if (constant.indexOf(closeId) !== -1) {
      // constant tabs cannot be closed
      return state;
    }

    const ids = [...constant, ...transient];
    const index = ids.indexOf(tab);

    const newTransient = reject(transient, tabId => tabId === closeId);

    let newId = tab;
    if (tab === closeId) {
      const newIds = [...constant, ...newTransient];

      let nextIndex = index;
      if (nextIndex >= newIds.length) {
        nextIndex--;
      }

      if (nextIndex < constant.length) {
        newId = state.lastConstant;
      } else {
        newId = newIds[nextIndex];
      }
    }

    return {
      ...state,
      tab: newId,
      tabs: {
        ...state.tabs,
        transient: newTransient,
      },
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const snapshot = action.payload;

    const tab = snapshot.current || state.tab;
    const transient = filter(
      map(snapshot.items, (tab: ITabDataSave) => {
        if (typeof tab !== "object" || !tab.id || !tab.path) {
          return;
        }

        return tab.id;
      }),
      x => !!x
    );

    return {
      ...state,
      tab,
      tabs: {
        ...state.tabs,
        transient,
      },
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });

  // happens after SESSION_READY depending on the user's profile (press, developer)
  on(actions.unlockTab, (state, action) => {
    const { path } = action.payload;

    const { constant } = state.tabs;

    if (constant.indexOf(path) !== -1) {
      // already unlocked, nothing to do
      return state;
    }

    return {
      ...state,
      tabs: {
        ...state.tabs,
        constant: [...constant, path],
      },
    };
  });
});
