import { TabInstances, TabDataSave, TabInstance } from "common/types";
import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { omit, each, size } from "underscore";
import { ITCH_URL_RE } from "common/constants/urls";

const initialState: TabInstances = {};

const maxHistorySize = 50;

function trimHistory(ti: TabInstance): TabInstance {
  if (!ti || !ti.history) {
    return ti;
  }

  const historySize = size(ti.history);
  if (historySize <= maxHistorySize) {
    return ti;
  }

  let offset = maxHistorySize - historySize;
  let newIndex = ti.currentIndex - offset;
  let newHistory = ti.history.slice(offset);
  if (newIndex < 0 || newIndex >= size(newHistory)) {
    newIndex = size(newHistory) - 1;
  }

  return {
    ...ti,
    currentIndex: newIndex,
    history: newHistory,
  };
}

export default reducer<TabInstances>(initialState, on => {
  on(actions.windOpened, (state, action) => {
    const { initialURL } = action.payload;
    return {
      ...state,
      ["initial-tab"]: {
        history: [{ url: initialURL }],
        currentIndex: 0,
        sleepy: true,
        sequence: 0,
        data: {},
      },
    };
  });

  on(actions.tabPageUpdate, (state, action) => {
    const { tab, page } = action.payload;
    const oldInstance = state[tab];
    if (!oldInstance) {
      // ignore fresh data for closed tabs
      return state;
    }

    let oldPage = oldInstance.history[oldInstance.currentIndex];
    if (page.url && oldPage.url && page.url !== oldPage.url) {
      // ignore page update for another URL
      return state;
    }

    let newHistory = [...oldInstance.history];
    newHistory[oldInstance.currentIndex] = { ...oldPage, ...page };

    return {
      ...state,
      [tab]: {
        ...omit(oldInstance, "sleepy"),
        history: newHistory,
      },
    };
  });

  on(actions.evolveTab, (state, action) => {
    const { tab, onlyIfMatchingURL } = action.payload;
    let { url, resource, label, replace } = action.payload;

    const oldInstance = state[tab];
    if (!oldInstance) {
      // ignore fresh data for closed tabs
      return state;
    }

    let { history, currentIndex } = oldInstance;
    if (history[currentIndex].url === url) {
      replace = true;
    } else if (onlyIfMatchingURL) {
      return state;
    }

    if (resource && /^collections\//.test(resource)) {
      url = `itch://${resource}`;
    }

    if (!resource && replace) {
      // keep the resource in case it's not specified
      resource = history[currentIndex].resource;
    }

    if (!label && replace) {
      label = history[currentIndex].label;
    }

    if (replace) {
      history = [...history];
      history[currentIndex] = {
        ...history[currentIndex],
        url,
        resource: resource || history[currentIndex].resource,
      };
    } else {
      history = [
        ...history.slice(0, currentIndex + 1),
        { url, resource, label },
      ];
      currentIndex = history.length - 1;
    }

    // merge old & new data
    let newInstance: TabInstance = {
      ...oldInstance,
      history,
      currentIndex,
    };
    newInstance = trimHistory(newInstance);

    return {
      ...state,
      [tab]: newInstance,
    };
  });

  on(actions.tabWentToIndex, (state, action) => {
    const { tab, index } = action.payload;
    const instance = state[tab];

    if (index >= 0 && index < instance.history.length) {
      return {
        ...state,
        [tab]: {
          ...instance,
          currentIndex: index,
        },
      };
    }

    return state;
  });

  on(actions.tabLosingWebContents, (state, action) => {
    const { tab } = action.payload;
    const oldInstance = state[tab];

    if (!oldInstance) {
      return state;
    }
    return {
      ...state,
      [tab]: {
        ...oldInstance,
        loading: false,
      },
    };
  });

  on(actions.tabLoadingStateChanged, (state, action) => {
    const { tab, loading } = action.payload;
    const oldInstance = state[tab];

    if (!oldInstance) {
      return state;
    }
    return {
      ...state,
      [tab]: {
        ...oldInstance,
        loading,
      },
    };
  });

  on(actions.tabFocused, (state, action) => {
    const { tab } = action.payload;
    const oldInstance = state[tab];

    // wake up any sleepy tabs
    if (oldInstance && oldInstance.sleepy) {
      return {
        ...state,
        [tab]: omit(oldInstance, "sleepy"),
      };
    }
    return state;
  });

  on(actions.tabsClosed, (state, action) => {
    const { tabs } = action.payload;
    return omit(state, ...tabs);
  });

  on(actions.tabOpened, (state, action) => {
    const { tab, url, resource } = action.payload;
    if (!tab) {
      return state;
    }
    return {
      ...state,
      [tab]: {
        history: [
          {
            url,
            resource,
            label: ["sidebar.loading"],
          },
        ],
        currentIndex: 0,
        sequence: 0,
      },
    };
  });

  on(actions.loggedOut, (state, action) => {
    return initialState;
  });

  on(actions.tabsRestored, (state, action) => {
    const { snapshot } = action.payload;

    let s = {};

    each(snapshot.items, (tabSave: TabDataSave) => {
      if (typeof tabSave !== "object") {
        return;
      }

      const { id, ...data } = tabSave;
      if (!id) {
        return;
      }

      s = {
        ...s,
        [tabSave.id]: trimHistory({
          ...data,
          sleepy: true,
          sequence: 0,
        }),
      };
    });

    return s;
  });

  on(actions.tabReloaded, (state, action) => {
    const { tab } = action.payload;
    return {
      ...state,
      [tab]: {
        ...state[tab],
        sequence: state[tab].sequence + 1,
      },
    };
  });
});
