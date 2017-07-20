import { ITabDataSet } from "../../types";
import * as actions from "../../actions";
import { pathPrefix } from "../../util/navigation";
import reducer from "../reducer";

import { omit } from "underscore";

const initialState = {} as ITabDataSet;

const emptyObj = {} as any;
const emptyArr = [] as any[];

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
        gameIds: (oldData.gameIds || emptyArr).map(x => undefined),
      },
    };
  });

  // FIXME: so, yeah, filters don't belong in preferences at all
  // this clears gameIds way too often, let's fix that
  on(actions.updatePreferences, (state, action) => {
    const nextState = {};
    for (const id of Object.keys(state)) {
      const oldData = state[id];
      nextState[id] = {
        ...oldData,
        gameIds: (oldData.gameIds || emptyArr).map(x => undefined),
      };
    }

    return nextState;
  });

  on(actions.tabEvolved, (state, action) => {
    const { id, data = emptyObj } = action.payload;
    const oldData = state[id];
    if (!oldData) {
      // ignore fresh data for closed tabs
      return state;
    }

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

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
