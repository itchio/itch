import { reject } from "underscore";

import { ModalsState } from "common/types";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState: ModalsState = [];

export default reducer<ModalsState>(initialState, (on) => {
  on(actions.openModal, (state, action) => {
    const modal = action.payload;
    return [modal, ...state];
  });

  on(actions.updateModalWidgetParams, (state, action) => {
    const { id, widgetParams } = action.payload;
    return state.map((modal) => {
      if (modal.id === id) {
        return { ...modal, widgetParams };
      }
      return modal;
    });
  });

  on(actions.modalClosed, (state, action) => {
    const { id } = action.payload;
    return reject(state, (modal) => modal.id === id);
  });
});
