
import {handleActions} from "redux-actions";
import {map, reject, omit, object, pick, indexBy, filter} from "underscore";
import * as uuid from "uuid";

import SearchExamples from "../../constants/search-examples";
import staticTabData from "../../constants/static-tab-data";

import {ISessionNavigationState, ITabDataSet, ITabDataSave} from "../../types";

import {
  IAction,
  IBinaryFilterChangedPayload,
  ITabChangedPayload,
  IDownloadStartedPayload,
  IFilterChangedPayload,
  IShortcutsVisibilityChangedPayload,
  ISwitchPagePayload,
  INavigatePayload,
  IMoveTabPayload,
  ICloseTabPayload,
  ICloseAllTabsPayload,
  ISearchFetchedPayload,
  ITabDataFetchedPayload,
  ITabEvolvedPayload,
  ITabsRestoredPayload,
  ILogoutPayload,
  IUnlockTabPayload,
  ICloseSearchPayload,
} from "../../constants/action-types";

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
  filters: {},
  binaryFilters: {
    onlyCompatible: true,
  },
  lastConstant: "featured",
  tabData: indexBy(pick(staticTabData, ...baseTabs), "id"),
  id: "featured",
  shortcutsShown: false,
} as ISessionNavigationState;

export default handleActions<ISessionNavigationState, any>({
  BINARY_FILTER_CHANGED: (state: ISessionNavigationState, action: IAction<IBinaryFilterChangedPayload>) => {
    const {field, value} = action.payload;
    const oldBinaryFilters = state.binaryFilters;
    return Object.assign({}, state, {
      binaryFilters: Object.assign({}, oldBinaryFilters, {
        [field]: value,
      }),
    });
  },

  TAB_CHANGED: (state: ISessionNavigationState, action: IAction<ITabChangedPayload>) => {
    const {tabs} = state;
    const {id} = action.payload;
    const {constant} = tabs;

    if (!id) {
      return state;
    }

    if (constant.indexOf(id) === -1) {
      return state;
    }

    return Object.assign({}, state, {
      lastConstant: id,
    });
  },

  DOWNLOAD_STARTED: (state: ISessionNavigationState, action: IAction<IDownloadStartedPayload>) => {
    const {tabs, tabData} = state;
    const {transient} = tabs;

    const has = transient.indexOf("downloads") >= 0;
    if (has) {
      return state;
    }

    return Object.assign({}, state, {
      tabs: Object.assign({}, tabs, {
        transient: [ ...transient, "downloads" ],
      }),
      tabData: Object.assign({}, tabData, {
        downloads: staticTabData.downloads,
      }),
    });
  },

  FILTER_CHANGED: (state: ISessionNavigationState, action: IAction<IFilterChangedPayload>) => {
    const {tab, query} = action.payload;
    const oldFilters = state.filters;
    return Object.assign({}, state, {
      filters: Object.assign({}, oldFilters, {
        [tab]: query,
      }),
    });
  },

  SHORTCUTS_VISIBILITY_CHANGED: (state: ISessionNavigationState,
                                 action: IAction<IShortcutsVisibilityChangedPayload>) => {
    const visible: boolean = action.payload.visible;
    return Object.assign({}, state, {shortcutsShown: visible});
  },

  SWITCH_PAGE: (state: ISessionNavigationState, action: IAction<ISwitchPagePayload>) => {
    const page: string = action.payload.page;
    return Object.assign({}, state, {page});
  },

  NAVIGATE: (state: ISessionNavigationState, action: IAction<INavigatePayload>) => {
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
      return Object.assign({}, state, {id});
    } else if (pathToId[id]) {
      // switching to an existing tab, by path (don't open same game twice, etc.)
      if (background) {
        return state;
      }
      const idForPath = pathToId[id];
      return Object.assign({}, state, {id: idForPath});
    } else {
      // open a new tab
      // static tabs don't get UUIDs
      const newTab = staticTabData[id] ? id : uuid.v4();

      const newTabs = {
        constant,
        transient: [
          ...transient,
          newTab,
        ],
      };

      const newTabData = Object.assign({}, tabData, {
        [newTab]: Object.assign({}, staticTabData[id], tabData[id], {path: id}, data),
      });

      return Object.assign({}, state, {
        id: background ? state.id : newTab,
        tabs: newTabs,
        tabData: newTabData,
      });
    }
  },

  MOVE_TAB: (state: ISessionNavigationState, action: IAction<IMoveTabPayload>) => {
    const {before, after} = action.payload;

    const {tabs} = state;
    const {transient} = tabs;

    const newTransient = map(transient, (t, i) => {
      switch (i) {
        case before:
          return transient[after];
        case after:
          return transient[before];
        default:
          return t;
      }
    });

    return Object.assign({}, state, {
      tabs: Object.assign({}, tabs, {
        transient: newTransient,
      }),
    });
  },

  CLOSE_TAB: (state: ISessionNavigationState, action: IAction<ICloseTabPayload>) => {
    const {id, tabs, tabData} = state;
    const closeId = action.payload.id || id;
    const {constant, transient} = tabs;

    if (constant.indexOf(closeId) !== -1) {
      return state;
    }

    const ids = constant.concat(transient);
    const index = ids.indexOf(id);

    const newTransient = reject(transient, (x) => x === closeId);
    const newTabData = omit(tabData, closeId);

    let newId = id;
    if (id === closeId) {
      if (newTransient.length > 0) {
        const newIds = constant.concat(newTransient);
        const numNewIds = newIds.length;

        const nextIndex = Math.min(index, numNewIds - 1);
        newId = newIds[nextIndex];
      } else {
        newId = state.lastConstant;
      }
    }

    return Object.assign({}, state, {
      id: newId,
      tabs: {constant, transient: newTransient},
      tabData: newTabData,
    });
  },

  CLOSE_ALL_TABS: (state: ISessionNavigationState, action: IAction<ICloseAllTabsPayload>) => {
    const {id, tabs, tabData} = state;
    const {constant, transient} = tabs;

    const newTabData = omit(tabData, ...transient);
    const newId = (constant.indexOf(id) === -1) ? "featured" : id;

    return Object.assign({}, state, {
      id: newId,
      tabs: {
        constant,
        transient: [],
      },
      tabData: newTabData,
    });
  },

  SEARCH_FETCHED: (state: ISessionNavigationState, action: IAction<ISearchFetchedPayload>) => {
    const {results} = action.payload;
    const searchExampleIndex = Math.floor(Math.random() * (SearchExamples.length - 1));

    return Object.assign({}, state, {
      searchResults: results,
      searchOpen: true,
      searchExample: SearchExamples[searchExampleIndex],
    });
  },

  TAB_DATA_FETCHED: (state: ISessionNavigationState, action: IAction<ITabDataFetchedPayload>) => {
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

    const newTabData = Object.assign({}, tabData, {
      [id]: Object.assign({}, tabData[id], data),
    });

    return Object.assign({}, state, {tabData: newTabData});
  },

  TAB_EVOLVED: (state: ISessionNavigationState, action: IAction<ITabEvolvedPayload>) => {
    const {id, data} = action.payload;
    const {tabData} = state;

    if (tabData[id]) {
      const newTabData = Object.assign({}, tabData, {
        [id]: Object.assign({}, tabData[id], data),
      });

      return Object.assign({}, state, {tabData: newTabData});
    }

    return state;
  },

  TABS_RESTORED: (state: ISessionNavigationState, action: IAction<ITabsRestoredPayload>) => {
    const snapshot = action.payload;

    const id = snapshot.current || state.id;
    const tabData = {} as ITabDataSet;
    const transient = filter(map(snapshot.items, (tab: ITabDataSave) => {
      if (typeof tab !== "object" || !tab.id || !tab.path) {
        return;
      }

      tabData[tab.id] = {
        path: tab.path,
      };
      return tab.id;
    }), (x) => !!x);

    return Object.assign({}, state, {
      id,
      tabs: Object.assign({}, state.tabs, {transient}),
      tabData: Object.assign({}, state.tabData, tabData),
    });
  },

  LOGOUT: (state: ISessionNavigationState, action: IAction<ILogoutPayload>) => {
    return initialState;
  },

  // happens after SESSION_READY depending on the user's profile (press, developer)
  UNLOCK_TAB: (state: ISessionNavigationState, action: IAction<IUnlockTabPayload>) => {
    const {path} = action.payload;

    const {constant} = state.tabs;

    return Object.assign({}, state, {
      tabs: Object.assign({}, state.tabs, {
        constant: [ ...constant, path ],
      }),
      tabData: Object.assign({}, state.tabData, {
        [path]: Object.assign({}, state.tabData[path], staticTabData[path]),
      }),
    });
  },

  CLOSE_SEARCH: (state: ISessionNavigationState, action: IAction<ICloseSearchPayload>) => {
    return Object.assign({}, state, {
      searchResults: null,
      searchOpen: false,
    });
  },
}, initialState);
