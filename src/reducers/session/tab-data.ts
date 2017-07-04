import { ITabDataSet } from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

import { omit } from "underscore";

const initialState = {} as ITabDataSet;

const emptyObj = {};

export default reducer<ITabDataSet>(initialState, on => {
  on(actions.tabDataFetched, (state, action) => {
    const { id, data } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
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

  on(actions.tabParamsChanged, (state, action) => {
    const { id } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
      return state;
    }

    return {
      ...state,
      [id]: {
        ...oldData,
        gameIds: (oldData.gameIds || []).map(x => undefined),
      },
    };
  });

  on(actions.tabEvolved, (state, action) => {
    const { id, data } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
      return state;
    }

    return {
      ...state,
      [id]: { ...oldData, ...data },
    };
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

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
