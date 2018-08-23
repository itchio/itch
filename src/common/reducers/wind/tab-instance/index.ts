import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { TabInstance } from "common/types";
import { omit, size } from "underscore";

const initialState: TabInstance = {
  history: [{ url: "itch://new-tab" }],
  currentIndex: 0,
  sleepy: true,
  sequence: 0,
};

const maxHistorySize = 50;

export function trimHistory(ti: TabInstance): TabInstance {
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

export default reducer<TabInstance>(initialState, on => {
  on(actions.tabPageUpdate, (state, action) => {
    const { page } = action.payload;

    let oldPage = state.history[state.currentIndex];
    if (page.url && oldPage.url && page.url !== oldPage.url) {
      // ignore page update for another URL
      return state;
    }

    let newHistory = [...state.history];
    newHistory[state.currentIndex] = { ...oldPage, ...page };

    return {
      ...omit(state, "sleepy"),
      history: newHistory,
    };
  });

  on(actions.evolveTab, (state, action) => {
    const { onlyIfMatchingURL } = action.payload;
    let { url, resource, label, replace } = action.payload;

    let { history, currentIndex } = state;
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
    let newState: TabInstance = {
      ...state,
      history,
      currentIndex,
    };
    return trimHistory(newState);
  });

  on(actions.tabWentToIndex, (state, action) => {
    const { index } = action.payload;

    if (index >= 0 && index < state.history.length) {
      return {
        ...state,
        currentIndex: index,
      };
    }

    return state;
  });

  on(actions.tabLosingWebContents, (state, action) => {
    return {
      ...state,
      loading: false,
    };
  });

  on(actions.tabLoadingStateChanged, (state, action) => {
    const { loading } = action.payload;
    return {
      ...state,
      loading,
    };
  });

  on(actions.tabFocused, (state, action) => {
    if (state.sleepy) {
      return omit(state, "sleepy");
    }
    return state;
  });

  on(actions.tabOpened, (state, action) => {
    const { url, resource } = action.payload;
    return {
      history: [
        {
          url,
          resource,
          label: ["sidebar.loading"],
        },
      ],
      currentIndex: 0,
      sequence: 0,
    };
  });

  on(actions.tabReloaded, (state, action) => {
    const { tab } = action.payload;
    return {
      ...state,
      sequence: state[tab].sequence + 1,
    };
  });
});
