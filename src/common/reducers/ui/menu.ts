import { actions } from "common/actions";
import reducer from "../reducer";

import { IUIMenuState } from "common/types";

const initialState = {
  template: [],
} as IUIMenuState;

export default reducer<IUIMenuState>(initialState, on => {
  on(actions.menuChanged, (state, action) => {
    const { template } = action.payload;
    return { template };
  });
});
