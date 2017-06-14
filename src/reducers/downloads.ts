
import {createStructuredSelector} from "reselect";

import * as invariant from "invariant";
import {indexBy, filter, map, last, omit} from "underscore";
import groupIdBy from "../helpers/group-id-by";

import {IDownloadsState} from "../types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";

const SPEED_DATA_POINT_COUNT = 60;

const selector = createStructuredSelector({
  itemIdsByGameId: (state: IDownloadsState) => (
    groupIdBy(state.items, "gameId")
  ),
});

const baseInitialState = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), (x) => ({ bps: 0 })),
  items: {},
  paused: false,
};
const initialState = { ...baseInitialState, ...selector(baseInitialState) };

const updateSingle = (state: IDownloadsState, record: any) => {
  const {items} = state;
  const {id} = record;
  invariant(id, "valid download id in progress");

  const download = items[id];
  if (!download) {
    // ignore progress messages for inactive downloads
    return state;
  }

  return {
    ...state,
    downloads: {
      ...state.items,
      [id]: {
        ...download,
        ...record,
      },
    },
  };
};

function downloadsExceptForGame (downloads: IDownloadsState["items"], gameId: number) {
  return indexBy(
    filter(downloads, (dl) => dl.game.id !== gameId),
    "id",
  );
}

function downloadsExceptFinished (downloads: IDownloadsState["items"]) {
  return indexBy(
    filter(downloads, (dl) => !dl.finished),
    "id",
  );
}

const baseReducer = reducer<IDownloadsState>(initialState, (on) => {
  on(actions.clearGameDownloads, (state, action) => {
    const {gameId} = action.payload;
    return {
      ...state,
      items: downloadsExceptForGame(state.items, gameId),
    };
  });

  on(actions.downloadStarted, (state, action) => {
    const download = action.payload;

    invariant(download.id, "valid download id in started");
    return {
      ...state,
      items: {
        ...downloadsExceptForGame(state.items, download.gameId),
        [download.id]: download,
      },
    };
  });

  on(actions.downloadProgress, (state, action) => {
    const record = action.payload;
    return updateSingle(state, record);
  });

  on(actions.downloadEnded, (state, action) => {
    const {id, err} = action.payload;
    return updateSingle(state, {id, finished: true, err});
  });

  on(actions.downloadSpeedDatapoint, (state, action) => {
    const {payload} = action;

    return {
      ...state,
      speeds: last([...state.speeds, payload], SPEED_DATA_POINT_COUNT),
    };
  });

  on(actions.prioritizeDownload, (state, action) => {
    const {id} = action.payload;
    const {activeDownload} = selector(state);

    if (!activeDownload || activeDownload.id === id) {
      // either no downloads, or only one. nothing to prioritize!
      return state;
    }

    // don't re-number priorities, just go into the negatives
    const order = activeDownload.order - 1;

    return updateSingle(state, {id, order});
  });

  on(actions.cancelDownload, (state, action) => {
    const {id} = action.payload;
    const {items} = state;

    const download = items[id];
    invariant(download, "cancelling valid download");

    return {
      ...state,
      items: omit(state.items, id),
    };
  });

  on(actions.clearFinishedDownloads, (state, action) => {
    return {
      ...state,
      items: downloadsExceptFinished(state.items),
    };
  });

  on(actions.pauseDownloads, (state, action) => {
    return {
      ...state,
      downloadsPaused: true,
    };
  });

  on(actions.resumeDownloads, (state, action) => {
    return {
      ...state,
      downloadsPaused: false,
    };
  });
});

export default derivedReducer(baseReducer, selector);
