import { ITabDataSet, ITabData, ITabDataSave } from "../../types";
import { actions } from "../../actions";
import reducer from "../reducer";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "reducers/tab-data" });

import { omit, each } from "underscore";

import staticTabData from "../../constants/static-tab-data";

const initialState = {
  ...staticTabData,
} as ITabDataSet;

for (const k of Object.keys(initialState)) {
  initialState[k].restored = true;
}

const emptyObj = {} as any;

let deepFields = ["users", "games", "collections", "web", "toast"];

function merge(
  a: ITabData,
  b: ITabData,
  { shallow }: { shallow: boolean }
): ITabData {
  if (shallow) {
    return { ...a, ...b };
  }

  const res = {
    ...a,
    ...b,
  };
  for (const df of deepFields) {
    res[df] = {
      ...a[df] || emptyObj,
      ...b[df] || emptyObj,
    };
  }
  return res;
}

export default reducer<ITabDataSet>(initialState, on => {
  on(actions.tabDataFetched, (state, action) => {
    const { tab, data, shallow } = action.payload;
    const oldData = state[tab];
    if (!oldData) {
      // ignore fresh data for closed tabs
      logger.debug(`tabDataFetched, ignoring fresh data for ${tab}`);
      return state;
    }

    return {
      ...state,
      [tab]: merge(oldData, data, { shallow }),
    };
  });

  on(actions.tabEvolved, (state, action) => {
    const { tab, data = emptyObj } = action.payload;
    const oldData = state[tab];
    if (!oldData) {
      // ignore fresh data for closed tabs
      return state;
    }

    // merge old & new data
    return {
      ...state,
      [tab]: merge(oldData, data, { shallow: false }),
    };
  });

  on(actions.focusTab, (state, action) => {
    const { tab } = action.payload;
    const oldData = state[tab] || emptyObj;

    // when constants tabs are focused, they need
    // an initial empty set of tabData, otherwise
    // we won't accept the result of fetchers for
    // those.
    return {
      ...state,
      [tab]: { ...oldData },
    };
  });

  on(actions.closeTab, (state, action) => {
    const { tab } = action.payload;
    if (staticTabData[tab]) {
      // never clear tabData for static tabs tabs
      return state;
    }
    return omit(state, tab);
  });

  on(actions.openTab, (state, action) => {
    const { tab, data = emptyObj } = action.payload;
    const staticData = staticTabData[tab] || emptyObj;
    return {
      ...state,
      [tab]: { ...data, ...staticData },
    };
  });

  on(actions.tabGotWebContents, (state, action) => {
    const { tab, webContentsId } = action.payload;
    const oldData = state[tab];

    return {
      ...state,
      [tab]: {
        ...oldData || emptyObj,
        webContentsId,
      },
    };
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });

  on(actions.tabsRestored, (state, action) => {
    const snapshot = action.payload;

    let s = state;

    each(snapshot.items, (tab: ITabDataSave) => {
      if (typeof tab !== "object") {
        return;
      }

      const { id, ...data } = tab;
      if (!id) {
        return;
      }

      s = {
        ...s,
        [tab.id]: {
          ...data,
          restored: true,
        },
      };
    });

    return s;
  });
});
