import { actions } from "../actions";
import reducer from "./reducer";

import { IButlerdState } from "../types";

const initialState = {
  endpoint: null,
} as IButlerdState;

export default reducer<IButlerdState>(initialState, on => {
  on(actions.gotButlerdEndpoint, (state, action) => {
    const { endpoint } = action.payload;
    return { ...state, endpoint };
  });
});
