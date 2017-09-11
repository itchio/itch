import reducer from "../reducer";
import * as actions from "../../actions";
import { IUIContextMenuState } from "../../types/index";

const initialState: IUIContextMenuState = {
  open: false,
  data: {
    x: 0,
    y: 0,
    template: [],
  },
};

export default reducer<IUIContextMenuState>(initialState, on => {
  on(actions.popupContextMenu, (state, action) => {
    const { x, y, template } = action.payload;

    return {
      ...state,
      data: { x, y, template },
      open: true,
    };
  });

  on(actions.closeContextMenu, (state, action) => {
    return {
      ...state,
      open: false,
    };
  });
});
