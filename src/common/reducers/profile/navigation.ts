import { reject, omit, map, filter } from "underscore";

import { IProfileNavigationState, ITabDataSave } from "common/types";

import { actions } from "common/actions";
import reducer from "../reducer";

import { arrayMove } from "react-sortable-hoc";

const baseTabs = ["itch://featured", "itch://library", "itch://collections"];

const initialState = {
  page: "gate",
  openTabs: {
    constant: baseTabs,
    transient: [],
  },
  loadingTabs: {},
  lastConstant: "itch://featured",
  tab: "itch://featured",
} as IProfileNavigationState;

export default reducer<IProfileNavigationState>(initialState, on => {
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
    const { constant } = state.openTabs;
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
    if (!tab) {
      return state;
    }

    const { constant, transient } = state.openTabs;

    return {
      ...state,
      tab: background ? state.tab : tab,
      openTabs: {
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

    const { openTabs } = state;
    const { transient } = openTabs;

    const newTransient = arrayMove(transient, before, after);

    return {
      ...state,
      openTabs: {
        ...state.openTabs,
        transient: newTransient,
      },
    };
  });

  on(actions.closeTab, (state, action) => {
    const { tab, openTabs } = state;
    const closeId = action.payload.tab || tab;
    const { constant, transient } = openTabs;

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
      openTabs: {
        ...state.openTabs,
        transient: newTransient,
      },
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const snapshot = action.payload;

    const tab = snapshot.current || state.tab;
    const transient = filter(
      map(snapshot.items, (tab: ITabDataSave) => {
        return tab.id;
      }),
      x => !!x
    );

    return {
      ...state,
      tab,
      openTabs: {
        ...state.openTabs,
        transient,
      },
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });

  // happens after SESSION_READY depending on the user's profile (press, developer)
  on(actions.unlockTab, (state, action) => {
    const { url } = action.payload;

    const { constant } = state.openTabs;

    if (constant.indexOf(url) !== -1) {
      // already unlocked, nothing to do
      return state;
    }

    return {
      ...state,
      openTabs: {
        ...state.openTabs,
        constant: [...constant, url],
      },
    };
  });
});
