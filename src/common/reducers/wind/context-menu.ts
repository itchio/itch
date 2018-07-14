import reducer from "common/reducers/reducer";
import { actions } from "common/actions";
import { ContextMenuState } from "common/types";

const initialState: ContextMenuState = {
  open: false,
  data: {
    clientX: 0,
    clientY: 0,
    template: [],
  },
};

export default reducer<ContextMenuState>(initialState, on => {
  on(actions.popupContextMenu, (state, action) => {
    const { clientX, clientY, template } = action.payload;

    return {
      ...state,
      data: { clientX, clientY, template },
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
