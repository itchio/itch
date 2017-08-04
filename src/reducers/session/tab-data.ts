import { ITabDataSet } from "../../types";
import * as actions from "../../actions";
import { pathPrefix } from "../../util/navigation";
import reducer from "../reducer";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "reducers/tab-data" });

import { omit } from "underscore";

const initialState = {} as ITabDataSet;

const emptyObj = {} as any;

export default reducer<ITabDataSet>(initialState, on => {
  on(actions.tabDataFetched, (state, action) => {
    const { id, data } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
      logger.debug(`tabDataFetched, ignoring fresh data for ${id}`);
      return state;
    }

    return {
      ...state,
      [id]: {
        ...oldData,
        ...data,
      },
    };
  });

  on(actions.tabEvolved, (state, action) => {
    const { id, data = emptyObj } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
      return state;
    }
    logger.debug(`${id} / ${oldData.path} evolved`);

    if (pathPrefix(oldData.path) === pathPrefix(data.path)) {
      // merge old & new data
      return {
        ...state,
        [id]: { ...oldData, ...data },
      };
    } else {
      // if the path changed, discard old data
      return {
        ...state,
        [id]: data,
      };
    }
  });

  on(actions.focusTab, (state, action) => {
    const { id } = action.payload;
    const oldData = state[id] || emptyObj;

    // when constants tabs are focused, they need
    // an initial empty set of tabData, otherwise
    // we won't accept the result of fetchers for
    // those.
    return {
      ...state,
      [id]: { ...oldData },
    };
  });

  on(actions.closeTab, (state, action) => {
    return omit(state, action.payload.id);
  });

  on(actions.openTab, (state, action) => {
    const { id, data = emptyObj } = action.payload;
    return {
      ...state,
      [id]: { ...data },
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
