
import {map, reject, omit, filter} from "underscore";

import {ISessionNavigationState, ITabDataSave} from "../../types";

import * as actions from "../../actions";
import reducer from "../reducer";

import {arrayMove} from "react-sortable-hoc";

const baseTabs = ["featured", "library", "collections"];

const initialState = {
  page: "gate",
  tabs: {
    constant: baseTabs,
    transient: [],
  },
  loadingTabs: {},
  lastConstant: "featured",
  id: "featured",
} as ISessionNavigationState;

export default reducer<ISessionNavigationState>(initialState, (on) => {
  on(actions.tabLoading, (state, action) => {
    const {id, loading} = action.payload;
    if (loading) {
      return {
        ...state,
        loadingTabs: {
          ...state.loadingTabs,
          [id]: true,
        },
      };
    } else {
      return {
        ...state,
        loadingTabs: omit(state.loadingTabs, id),
      };
    }
  });

  on(actions.tabChanged, (state, action) => {
    const {constant} = state.tabs;
    const {id} = action.payload;

    if (!id) {
      return state;
    }

    if (constant.indexOf(id) === -1) {
      return state;
    }

    return {
      ...state,
      lastConstant: id,
    };
  });

  on(actions.switchPage, (state, action) => {
    const {page} = action.payload;
    return {
      ...state,
      page,
    };
  });

  on(actions.openTab, (state, action) => {
    const {id, background} = action.payload;
    const {constant, transient} = state.tabs;

    return {
      ...state,
      id: background ? state.id : id,
      tabs: {
        constant,
        transient: [
          id,
          ...transient,
        ],
      },
    };
  });

  on(actions.focusTab, (state, action) => {
    const {id} = action.payload;

    return {
      ...state,
      id,
    };
  });

  on(actions.moveTab, (state, action) => {
    const {before, after} = action.payload;

    const {tabs} = state;
    const {transient} = tabs;

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
    const {id, tabs} = state;
    const closeId = action.payload.id || id;
    const {constant, transient} = tabs;

    if (constant.indexOf(closeId) !== -1) {
      // constant tabs cannot be closed
      return state;
    }

    const ids = constant.concat(transient);
    const index = ids.indexOf(id);

    const newTransient = reject(transient, (tabId) => tabId === closeId);

    let newId = id;
    if (id === closeId) {
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
      id: newId,
      tabs: {
        ...state.tabs,
        transient: newTransient,
      },
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const snapshot = action.payload;

    const id = snapshot.current || state.id;
    const transient = filter(map(snapshot.items, (tab: ITabDataSave) => {
      if (typeof tab !== "object" || !tab.id || !tab.path) {
        return;
      }

      return tab.id;
    }), (x) => !!x);

    return {
      ...state,
      id,
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
    const {path} = action.payload;

    const {constant} = state.tabs;

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
