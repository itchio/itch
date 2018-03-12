import { createStructuredSelector } from "reselect";

import { map, indexBy } from "underscore";
import groupIdBy from "../helpers/group-id-by";

import { IDownloadsState } from "../types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import { actions } from "../actions";
import { Download } from "../buse/messages";

const SPEED_DATA_POINT_COUNT = 60;

const selector = createStructuredSelector({
  itemIdsByGameId: (state: IDownloadsState) =>
    groupIdBy<Download>(state.items, i => String(i.game && i.game.id)),
});

const baseInitialState: Partial<IDownloadsState> = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), x => 0),
  items: {},
  progresses: {},
  paused: true,
};
const initialState: IDownloadsState = {
  ...baseInitialState,
  ...selector(baseInitialState),
};

const baseReducer = reducer<IDownloadsState>(initialState, on => {
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

  on(actions.pauseDownloads, (state, action) => {
    return {
      ...state,
      paused: true,
    };
  });

  on(actions.resumeDownloads, (state, action): IDownloadsState => {
    return {
      ...state,
      paused: false,
    };
  });
});

export default derivedReducer(baseReducer, selector);
