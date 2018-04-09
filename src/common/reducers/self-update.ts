import { ISelfUpdateState } from "common/types";
import { actions } from "common/actions";
import reducer from "./reducer";

const initialState = {
  available: null,
  checking: false,
  downloading: null,
  downloaded: null,

  uptodate: false,
  error: null,
} as ISelfUpdateState;

export default reducer<ISelfUpdateState>(initialState, on => {
  on(actions.checkForSelfUpdate, (state, action) => {
    return {
      ...state,
      checking: true,
    };
  });

  on(actions.selfUpdateAvailable, (state, action) => {
    const { spec, downloading } = action.payload;

    return {
      ...state,
      checking: false,
      ...(downloading ? { downloading: spec } : { available: spec }),
    };
  });

  on(actions.selfUpdateNotAvailable, (state, action) => {
    const { uptodate } = action.payload;

    return {
      ...state,
      checking: false,
      available: null,
      uptodate,
    };
  });

  on(actions.selfUpdateError, (state, action) => {
    const error = action.payload.message;
    return {
      ...state,
      error,
      checking: false,
      available: null,
      downloading: null,
    };
  });

  on(actions.selfUpdateDownloaded, (state, action) => {
    const { downloading } = state;
    return {
      ...state,
      downloaded: downloading,
      downloading: null,
    };
  });

  on(actions.snoozeSelfUpdate, (state, action) => {
    return {
      ...state,
      downloaded: null,
    };
  });

  on(actions.dismissStatus, (state, action) => {
    return {
      ...state,
      error: null,
      uptodate: false,
      available: null,
    };
  });
});
