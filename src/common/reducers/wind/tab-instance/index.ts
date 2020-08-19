import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import {
  TabInstance,
  TabInstanceLocation,
  TabInstanceResource,
  TabInstanceStatus,
  QueryParams,
  Action,
} from "common/types";
import { omit, size } from "underscore";
import * as urlParser from "url";
import * as querystring from "querystring";
import equal from "react-fast-compare";
import { internalPageToIcon } from "common/helpers/space";

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

function urlToLocation(url: string): TabInstanceLocation {
  const parsedUrl = urlParser.parse(url);
  const protocol = parsedUrl.protocol;
  const pathname = parsedUrl.pathname;
  const hostname = parsedUrl.hostname;
  const query: QueryParams = {};
  const parsedQuery = querystring.parse(parsedUrl.query);
  for (const k of Object.keys(parsedQuery)) {
    const v = parsedQuery[k];
    if (Array.isArray(v)) {
      query[k] = v[0];
    } else {
      query[k] = v;
    }
  }

  let pathElements: string[] = [];
  if (pathname) {
    pathElements = pathname.replace(/^\//, "").split("/");
  }
  let internalPage: string;
  let firstPathElement: string;
  let secondPathElement: string;
  let firstPathNumber: number;
  let isBrowser = true;
  if (protocol === "itch:") {
    internalPage = hostname;
    isBrowser = false;
  }
  firstPathElement = pathElements[0];
  secondPathElement = pathElements[1];
  firstPathNumber = parseInt(pathElements[0], 10);

  return {
    url,
    protocol,
    pathname,
    hostname,
    query,
    internalPage,
    firstPathElement,
    secondPathElement,
    firstPathNumber,
    isBrowser,
  };
}

const selector = (state: TabInstance): TabInstance => {
  if (typeof state !== "object") {
    return state;
  }

  const { history, currentIndex } = state;
  const page = history[currentIndex];
  let location: TabInstanceLocation = page ? urlToLocation(page.url) : null;
  let resource: TabInstanceResource;
  if (page && page.resource) {
    let resourceElements = page.resource.split("/");
    resource = {
      prefix: resourceElements[0],
      suffix: resourceElements[1],
      numericId: parseInt(resourceElements[1], 10),
      value: page.resource,
    };
  }
  let status: TabInstanceStatus = {
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
    favicon: page ? page.favicon : null,
    icon: null, // TODO
    label: null, // TODO
    lazyLabel: null, // TODO
  };
  if (location) {
    status.icon = internalPageToIcon(location.internalPage);
  }
  if (page) {
    status.label = page ? page.label : null;
    if (status.label) {
      status.lazyLabel = status.label;
    } else {
      status.lazyLabel = "";
      if (currentIndex > 0) {
        const prevPage = history[currentIndex - 1];
        if (prevPage && prevPage.label) {
          status.lazyLabel = prevPage.label;
        }
      }
    }
  }

  let newState = {
    ...state,
    location,
    resource,
    status,
  };

  if (equal(state, newState)) {
    return state;
  }
  return newState;
};

const baseReducer = reducer<TabInstance>(initialState, (on) => {
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
      let newState = {
        ...state,
        currentIndex: index,
      };
      let newPage = newState.history[newState.currentIndex];
      newState.history = [...newState.history];
      newState.history[newState.currentIndex] = {
        ...newPage,
        restoredScrollTop: newPage.scrollTop,
      };
      // now I know what you're thinking "whoa hold on, that code above looks silly"
      // well, we can't just assign `newState.history` without making it a new
      // object - if we don't have reference equality, we have nothing.
      return newState;
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
    return {
      ...state,
      sequence: state.sequence + 1,
    };
  });
});

export default function (state: TabInstance, action: Action<any>): TabInstance {
  state = baseReducer(state, action);
  state = selector(state);
  return state;
}
