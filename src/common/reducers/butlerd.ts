import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { ButlerdState } from "common/types";

const initialState: ButlerdState = {
  startedAt: null,
};

export default reducer<ButlerdState>(initialState, (on) => {
  on(actions.gotButlerdEndpoint, (state, action) => {
    const { endpoint } = action.payload;
    return { ...state, endpoint };
  });

  on(actions.spinningUpButlerd, (state, action) => {
    const { startedAt } = action.payload;
    return { ...state, startedAt };
  });
});
