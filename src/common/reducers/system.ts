import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { SystemState } from "common/types";

const initialState = {
  locationScanProgress: null,
} as SystemState;

export default reducer<SystemState>(initialState, (on) => {
  on(actions.systemAssessed, (state, action) => {
    const { system } = action.payload;
    return {
      ...state,
      ...system,
    };
  });

  on(actions.proxySettingsDetected, (state, action) => {
    const { proxy, source } = action.payload;
    return {
      ...state,
      proxy,
      proxySource: source,
    };
  });

  on(actions.quit, (state, action) => {
    return {
      ...state,
      quitting: true,
    };
  });

  on(actions.cancelQuit, (state, action) => {
    return {
      ...state,
      quitting: false,
    };
  });

  on(actions.silentlyScanInstallLocations, (state, action) => {
    return {
      ...state,
      locationScanProgress: 0,
    };
  });

  on(actions.locationScanProgress, (state, action) => {
    const { progress } = action.payload;
    return {
      ...state,
      locationScanProgress: progress,
    };
  });

  on(actions.locationScanDone, (state, action) => {
    return {
      ...state,
      locationScanProgress: null,
    };
  });
});
