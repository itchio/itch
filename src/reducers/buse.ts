import { actions } from "../actions";
import reducer from "./reducer";

import { IBuseState } from "../types";

const initialState = {
  endpoint: null,
} as IBuseState;

export default reducer<IBuseState>(initialState, on => {
  on(actions.gotBuseEndpoint, (state, action) => {
    const { endpoint } = action.payload;
    return { ...state, endpoint };
  });
});
