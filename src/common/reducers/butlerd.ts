import { actions } from "common/actions";
import reducer from "./reducer";

import { IButlerdState } from "common/types";

const initialState = {
  endpoint: null,
} as IButlerdState;

export default reducer<IButlerdState>(initialState, on => {
  on(actions.gotButlerdEndpoint, (state, action) => {
    const { endpoint } = action.payload;
    return { ...state, endpoint };
  });
});
