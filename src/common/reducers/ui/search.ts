import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { UISearchState } from "common/types";

const initialState = {
  open: false,
} as UISearchState;

export default reducer<UISearchState>(initialState, (on) => {
  on(actions.searchVisibilityChanged, (state, action) => {
    const { open } = action.payload;
    return { ...state, open };
  });
});
