import { reject, omit, map, filter } from "underscore";

import { NavigationState, TabDataSave } from "common/types";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import arrayMove from "array-move";

const initialState: NavigationState = {
  openTabs: ["initial-tab"],
  loadingTabs: {},
  tab: "initial-tab",
};

export default reducer<NavigationState>(initialState, on => {
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

  on(actions.openTab, (state, action) => {
    const { tab, background } = action.payload;
    if (!tab) {
      return state;
    }

    const { openTabs } = state;

    return {
      ...state,
      tab: background ? state.tab : tab,
      openTabs: [tab, ...openTabs],
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

    const newOpenTabs = arrayMove(openTabs, before, after);

    return {
      ...state,
      openTabs: newOpenTabs,
    };
  });

  on(actions.closeTab, (state, action) => {
    const { tab, openTabs } = state;
    if (openTabs.length <= 1) {
      return state;
    }

    const closeId = action.payload.tab || tab;

    const index = openTabs.indexOf(tab);
    const newOpenTabs = reject(openTabs, tabId => tabId === closeId);

    let newId = tab;
    if (tab === closeId) {
      let nextIndex = index;
      if (nextIndex >= newOpenTabs.length) {
        nextIndex--;
      }

      newId = newOpenTabs[nextIndex];
    }

    return {
      ...state,
      tab: newId,
      openTabs: newOpenTabs,
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const { snapshot } = action.payload;

    const tab = snapshot.current || state.tab;
    const openTabs = filter(
      map(snapshot.items, (tab: TabDataSave) => {
        return tab.id;
      }),
      x => !!x
    );

    return {
      ...state,
      tab,
      openTabs,
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
