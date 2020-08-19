import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import { DownloadsState } from "common/types";
import { indexBy, map } from "underscore";

const SPEED_DATA_POINT_COUNT = 60;

const initialState: DownloadsState = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), (x) => 0),
  items: {},
  progresses: {},
  paused: true,
};

export default reducer<DownloadsState>(initialState, (on) => {
  on(actions.downloadsListed, (state, action) => {
    const { downloads } = action.payload;
    return {
      ...state,
      items: indexBy(downloads, "id"),
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
