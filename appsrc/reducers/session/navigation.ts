
import {map, reject, omit, object, pick, indexBy, filter} from "underscore";
import * as uuid from "uuid";

import staticTabData from "../../constants/static-tab-data";

import {ISessionNavigationState, ITabDataSet, ITabDataSave} from "../../types";

import * as actions from "../../actions";
import reducer from "../reducer";

import {arrayMove} from "react-sortable-hoc";

interface IPathToIdMap {
  [path: string]: string;
}

const perish = process.env.PERISH === "1" ? console.log.bind(console) : () => 0;

const baseTabs = ["featured", "library", "collections"];

// TODO: please, please split me into different sub-reducers.

const initialState = {
  page: "gate",
  tabs: {
    constant: baseTabs,
    transient: [],
  },
  loadingTabs: {},
  filters: {},
  lastConstant: "featured",
  tabData: indexBy(pick(staticTabData, ...baseTabs), "id"),
  id: "featured",
  shortcutsShown: false,
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

  on(actions.filterChanged, (state, action) => {
    const {tab, query} = action.payload;
    return {
      ...state,
      filters: {
        ...state.filters,
        [tab]: query,
      },
    };
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

  on(actions.downloadStarted, (state, action) => {
    const {transient} = state.tabs;

    const has = transient.indexOf("downloads") >= 0;
    if (has) {
      return state;
    }

    return {
      ...state,
      tabs: {
        ...state.tabs,
        transient: [ "downloads", ...transient ],
      },
      tabData: {
        ...state.tabData,
        downloads: staticTabData.downloads,
      },
    };
  });

  on(actions.switchPage, (state, action) => {
    const {page} = action.payload;
    return {
      ...state,
      page,
    };
  });

  on(actions.navigate, (state, action) => {
    const {id, data, background} = action.payload;

    const {tabData} = state;
    const {tabs} = state;
    const {constant, transient} = tabs;

    const pathToId = object(map(tabData, (x, xId) => [x.path, xId])) as IPathToIdMap;

    if (tabData[id]) {
      // switching to an existing tab, by id
      if (background) {
        return state;
      }
      return {...state, id};
    } else if (pathToId[id]) {
      // switching to an existing tab, by path (don't open same game twice, etc.)
      if (background) {
        return state;
      }
      const idForPath = pathToId[id];
      return {...state, id: idForPath};
    } else {
      // open a new tab
      // static tabs don't get UUIDs
      const newTab = staticTabData[id] ? id : uuid.v4();

      const newTabs = {
        constant,
        transient: [
          newTab,
          ...transient,
        ],
      };

      const newTabData = {
        ...tabData,
        [newTab]: {
          ...staticTabData[id],
          ...tabData[id],
          path: id,
          ...data,
        },
      };

      return {
        ...state,
        id: background ? state.id : newTab,
        tabs: newTabs,
        tabData: newTabData,
      };
    }
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
    const {id, tabs, tabData} = state;
    const closeId = action.payload.id || id;
    const {constant, transient} = tabs;

    if (constant.indexOf(closeId) !== -1) {
      // constant tabs cannot be closed
      return state;
    }

    const ids = constant.concat(transient);
    const index = ids.indexOf(id);

    const newTransient = reject(transient, (tabId) => tabId === closeId);
    const newTabData = omit(tabData, closeId);

    let newId = id;
    if (id === closeId) {
      const newIds = constant.concat(newTransient);

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
      tabData: newTabData,
    };
  });

  on(actions.closeAllTabs, (state, action) => {
    const {id, tabs, tabData} = state;
    const {constant, transient} = tabs;

    const newTabData = omit(tabData, ...transient);
    const newId = (constant.indexOf(id) === -1) ? "featured" : id;

    return {
      ...state,
      id: newId,
      tabs: {
        constant,
        transient: [],
      },
      tabData: newTabData,
    };
  });

  on(actions.tabDataFetched, (state, action) => {
    const {id, timestamp, data} = action.payload;
    if (!timestamp) {
      perish("Ignoring non-timestamped tabData: ", id, data);
      return state;
    }

    const {tabData} = state;
    const oldData = tabData[id];
    if (oldData && oldData.timestamp && oldData.timestamp > timestamp) {
      perish("Ignoring stale tabData: ", id, data);
      return state;
    }

    return {
      ...state,
      tabData: {
        ...tabData,
        [id]: {
          ...tabData[id],
          ...data,
        },
      },
    };
  });

  on(actions.tabEvolved, (state, action) => {
    const {id, data} = action.payload;
    const {tabData} = state;

    if (tabData[id]) {
      return {
        ...state,
        tabData: {
          ...tabData,
          [id]: {
            ...tabData[id],
            ...data,
          },
        },
      };
    }

    return state;
  });

  on(actions.tabsRestored, (state, action) => {
    const snapshot = action.payload;

    const id = snapshot.current || state.id;
    const tabData = {} as ITabDataSet;
    const transient = filter(map(snapshot.items, (tab: ITabDataSave) => {
      if (typeof tab !== "object" || !tab.id || !tab.path) {
        return;
      }

      tabData[tab.id] = {
        ...omit(tab, "id"),
      };
      return tab.id;
    }), (x) => !!x);

    return {
      ...state,
      id,
      tabs: {
        ...state.tabs,
        transient,
      },
      tabData: {
        ...state.tabData,
        ...tabData,
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

    return {
      ...state,
      tabs: {
        ...state.tabs,
        constant: [...constant, path],
      },
      tabData: {
        ...state.tabData,
        [path]: {
          ...state.tabData[path],
          ...staticTabData[path],
        },
      },
    };
  });
});
