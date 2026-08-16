import { actions } from "common/actions";
import indexById from "common/helpers/index-by-id";
import reducer from "common/reducers/reducer";
import { DownloadsState } from "common/types";

const SPEED_DATA_POINT_COUNT = 60;

const initialState: DownloadsState = {
  speeds: new Array(SPEED_DATA_POINT_COUNT).fill(0),
  items: {},
  progresses: {},
  paused: true,
};

export default reducer<DownloadsState>(initialState, (on) => {
  on(actions.downloadsListed, (state, action) => {
    const { downloads } = action.payload;
    return {
      ...state,
      items: indexById(downloads),
    };
  });

  on(actions.downloadProgress, (state, action) => {
    const { download, progress, speedHistory } = action.payload;
    return {
      ...state,
      progresses: {
        ...state.progresses,
        [download.id]: progress,
      },
      speeds: speedHistory,
    };
  });

  on(actions.setDownloadsPaused, (state, action) => {
    const { paused } = action.payload;
    return {
      ...state,
      paused,
    };
  });
});
