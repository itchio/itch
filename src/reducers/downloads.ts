
import {createSelector, createStructuredSelector} from "reselect";

import * as invariant from "invariant";
import {indexBy, groupBy, where, sortBy, pluck, filter, map, first, last, omit} from "underscore";

import {IDownloadsState} from "../types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";

const SPEED_DATA_POINT_COUNT = 60;

const structSel = createStructuredSelector({
  downloadsByOrder: (state: IDownloadsState) => (
    pluck(sortBy(filter(state.downloads, (x) => !x.finished), "order"), "id")
  ),
  activeDownload: (state: IDownloadsState) => (
    first(sortBy(filter(state.downloads, (x) => !x.finished), "order"))
  ),
  finishedDownloads: (state: IDownloadsState) => (
    pluck(sortBy(where(state.downloads, {finished: true}), "order"), "id")
  ),
  downloadsByGameId: (state: IDownloadsState) => (
    groupBy(state.downloads, "gameId")
  ),
});

const selector = createSelector(
  structSel,
  (fields: IDownloadsState) => {
    const {activeDownload} = fields;
    const progress = (activeDownload && activeDownload.progress) || -1;

    return { ...fields, activeDownload, progress };
  },
);

const baseInitialState = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), (x) => ({ bps: 0 })),
  downloads: {},
  downloadsPaused: false,
};
const initialState = { ...baseInitialState, ...selector(baseInitialState) };

const updateSingle = (state: IDownloadsState, record: any) => {
  const {downloads} = state;
  const {id} = record;
  invariant(id, "valid download id in progress");

  const download = downloads[id];
  if (!download) {
    // ignore progress messages for inactive downloads
    return state;
  }

  return {
    ...state,
    downloads: {
      ...state.downloads,
      [id]: {
        ...download,
        ...record,
      },
    },
  };
};

function downloadsExceptForGame (downloads: IDownloadsState["downloads"], gameId: number) {
  return indexBy(
    filter(downloads, (dl) => dl.gameId !== gameId),
    "id",
  );
}

function downloadsExceptFinished (downloads: IDownloadsState["downloads"]) {
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
      downloads: downloadsExceptForGame(state.downloads, gameId),
    };
  });

  on(actions.downloadStarted, (state, action) => {
    const download = action.payload;

    invariant(download.id, "valid download id in started");
    return {
      ...state,
      downloads: {
        ...downloadsExceptForGame(state.downloads, download.gameId),
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
    const {downloads} = state;

    const download = downloads[id];
    invariant(download, "cancelling valid download");

    return {
      ...state,
      downloads: omit(state.downloads, id),
    };
  });

  on(actions.clearFinishedDownloads, (state, action) => {
    return {
      ...state,
      downloads: downloadsExceptFinished(state.downloads),
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
