
import {ITabDataSet} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

import {omit} from "underscore";

const initialState = {} as ITabDataSet;

const emptyObj = {};

export default reducer<ITabDataSet>(initialState, (on) => {
  on(actions.tabDataFetched, (state, action) => {
    const {id, data} = action.payload;
    const oldData = state[id] || emptyObj;

    return {
      ...state,
      [id]: {
        ...oldData,
        ...data,
      },
    };
  });

  on(actions.tabEvolved, (state, action) => {
    const {id, data} = action.payload;
    const oldData = state[id] || emptyObj;

    return {
      ...state,
      [id]: {
        ...oldData,
        ...data,
      },
    };
  });

  on(actions.closeTab, (state, action) => {
    return omit(state, action.payload.id);
  });

  on(actions.openTab, (state, action) => {
    const {id, data} = action.payload;
    return {
      ...state,
      [id]: data,
    };
  });
});
