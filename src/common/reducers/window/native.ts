import { NativeWindowState } from "common/types";

import { actions } from "common/actions";
import reducer from "../reducer";

const initialState = {
  id: null,
  focused: false,
  fullscreen: false,
  maximized: false,
} as NativeWindowState;

export default reducer<NativeWindowState>(initialState, on => {
  on(actions.windowOpened, (state, action) => {
    const { nativeId } = action.payload;
    return { ...state, id: nativeId };
  });

  on(actions.windowDestroyed, (state, action) => {
    return { ...state, id: null, focused: false };
  });

  on(actions.windowFocusChanged, (state, action) => {
    const { focused } = action.payload;
    return { ...state, focused };
  });

  on(actions.windowFullscreenChanged, (state, action) => {
    const { fullscreen } = action.payload;
    return { ...state, fullscreen };
  });

  on(actions.windowMaximizedChanged, (state, action) => {
    const { maximized } = action.payload;
    return { ...state, maximized };
  });
});
