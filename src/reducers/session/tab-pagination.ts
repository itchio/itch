import { ITabPaginationSet } from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {} as ITabPaginationSet;

const emptyObj = {};

export default reducer<ITabPaginationSet>(initialState, on => {
  on(actions.tabPaginationChanged, (state, action) => {
    const { tab, pagination } = action.payload;

    return {
      ...state,
      [tab]: {
        ...state[tab] || emptyObj,
        ...pagination,
      },
    };
  });
});
