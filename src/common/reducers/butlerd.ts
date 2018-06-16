import { actions } from "common/actions";
import reducer from "./reducer";

import { ButlerdState } from "common/types";

const initialState = {
  endpoint: null,
} as ButlerdState;

export default reducer<ButlerdState>(initialState, on => {
  on(actions.gotButlerdEndpoint, (state, action) => {
    const { endpoint } = action.payload;
    return { ...state, endpoint };
  });
});
