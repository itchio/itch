import { NativeWindowState } from "common/types";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState = {
  id: null,
  focused: false,
  fullscreen: false,
  htmlFullscreen: false,
  maximized: false,
} as NativeWindowState;

export default reducer<NativeWindowState>(initialState, (on) => {
  on(actions.windOpened, (state, action) => {
    const { nativeId } = action.payload;
    return { ...state, id: nativeId };
  });

  on(actions.windDestroyed, (state, action) => {
    return { ...state, id: null, focused: false };
  });

  on(actions.windFocusChanged, (state, action) => {
    const { focused } = action.payload;
    return { ...state, focused };
  });

  on(actions.windFullscreenChanged, (state, action) => {
    const { fullscreen } = action.payload;
    return { ...state, fullscreen };
  });

  on(actions.windHtmlFullscreenChanged, (state, action) => {
    const { htmlFullscreen } = action.payload;
    return { ...state, htmlFullscreen };
  });

  on(actions.windMaximizedChanged, (state, action) => {
    const { maximized } = action.payload;
    return { ...state, maximized };
  });
});
