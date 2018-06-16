import { createStructuredSelector } from "reselect";

import { map, indexBy } from "underscore";
import groupIdBy from "common/helpers/group-id-by";

import { DownloadsState } from "common/types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import { actions } from "common/actions";
import { Download } from "common/butlerd/messages";

const SPEED_DATA_POINT_COUNT = 60;

const selector = createStructuredSelector({
  itemIdsByGameId: (state: DownloadsState) =>
    groupIdBy<Download>(state.items, i => String(i.game && i.game.id)),
});

const baseInitialState: Partial<DownloadsState> = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), x => 0),
  items: {},
  progresses: {},
  paused: true,
};
const initialState: DownloadsState = {
  ...baseInitialState,
  ...selector(baseInitialState),
};

const baseReducer = reducer<DownloadsState>(initialState, on => {
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

export default derivedReducer(baseReducer, selector);
