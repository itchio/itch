
import * as actions from "../actions";
import reducer from "./reducer";

import {IQueriesState} from "../types";

const initialState = {};

export default reducer<IQueriesState>(initialState, (on) => {
  // TODO: be much smarter+faster here.
  // this is a good place to dedupe updates if records
  // are deepEqual
  on(actions.fetchedQuery, (state, action) => {
    const data = action.payload.data;
    return {
      ...state,
      ...data,
    };
  });
});
