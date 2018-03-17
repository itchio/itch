import { actions } from "../actions";
import reducer from "./reducer";

import { ICommonsState } from "../types";

const initialState: ICommonsState = {
  downloadKeys: {},
  downloadKeyIdsByGameId: {},
  caves: {},
  caveIdsByGameId: {},
  locationSizes: {},
};

export default reducer<ICommonsState>(initialState, on => {
  // TODO: be much smarter+faster here.
  // this is a good place to dedupe updates if records
  // are deepEqual
  on(actions.commonsUpdated, (state, action) => {
    const data = action.payload;
    return {
      ...state,
      ...data,
    };
  });
});
