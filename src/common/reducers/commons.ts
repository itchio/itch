import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { CommonsState } from "common/types";

const initialState: CommonsState = {
  downloadKeys: {},
  downloadKeyIdsByGameId: {},
  caves: {},
  caveIdsByGameId: {},
  locationSizes: {},
};

export default reducer<CommonsState>(initialState, (on) => {
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
