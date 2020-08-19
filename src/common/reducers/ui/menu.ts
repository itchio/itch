import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { UIMenuState } from "common/types";

const initialState = {
  template: [],
} as UIMenuState;

export default reducer<UIMenuState>(initialState, (on) => {
  on(actions.menuChanged, (state, action) => {
    const { template } = action.payload;
    return { template };
  });
});
