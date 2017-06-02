
import {IUIMainWindowState} from "../../types";

import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {
  id: null,
  focused: false,
  fullscreen: false,
  maximized: false,
} as IUIMainWindowState;

export default reducer<IUIMainWindowState>(initialState, (on) => {
  on(actions.windowReady, (state, action) => {
    const {id} = action.payload;
    return {...state, id, focused: true};
  });

  on(actions.windowDestroyed, (state, action) => {
    return {...state, id: null, focused: false};
  });

  on(actions.prepareQuit, (state, action) => {
    return {...state, quitting: true};
  });

  on(actions.windowFocusChanged, (state, action) => {
    const {focused} = action.payload;
    return {...state, focused};
  });

  on(actions.windowFullscreenChanged, (state, action) => {
    const {fullscreen} = action.payload;
    return {...state, fullscreen};
  });

  on(actions.windowMaximizedChanged, (state, action) => {
    const {maximized} = action.payload;
    return {...state, maximized};
  });
});
