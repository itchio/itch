import { ITabDataSet } from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "reducers/tab-data" });

import { omit } from "underscore";

const initialState = {} as ITabDataSet;

const emptyObj = {} as any;

export default reducer<ITabDataSet>(initialState, on => {
  on(actions.tabDataFetched, (state, action) => {
    const { tab, data } = action.payload;
    const oldData = state[tab];
    if (!oldData) {
      // ignore fresh data for closed tabs
      logger.debug(`tabDataFetched, ignoring fresh data for ${tab}`);
      return state;
    }

    return {
      ...state,
      [tab]: {
        ...oldData,
        ...data,
      },
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
      [tab]: { ...oldData, ...data },
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
    return omit(state, action.payload.tab);
  });

  on(actions.openTab, (state, action) => {
    const { tab, data = emptyObj } = action.payload;
    return {
      ...state,
      [tab]: { ...data },
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
});
