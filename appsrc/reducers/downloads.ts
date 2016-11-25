
import * as uuid from "uuid";
import {handleActions} from "redux-actions";
import {createSelector, createStructuredSelector} from "reselect";

import * as invariant from "invariant";
import {indexBy, where, sortBy, pluck, filter, map, first, last, omit} from "underscore";

import {IDownloadsState, IGameRecord} from "../types";
import {
   IAction,
   IClearGameDownloadsPayload,
   IDownloadStartedPayload, IDownloadProgressPayload, IDownloadEndedPayload,
   IDownloadSpeedDatapointPayload,
   IPrioritizeDownloadPayload, ICancelDownloadPayload,
   IClearFinishedDownloadsPayload,
   IPauseDownloadsPayload,
   IResumeDownloadsPayload,
  } from "../constants/action-types";

import derivedReducer from "./derived-reducer";

const makeFakeDownloads = () => indexBy(map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (x, i) => {
  return {
    id: uuid.v4(),
    game: {
      id: -i,
      title: "Sample game",
      userId: -(i + 100),
    } as IGameRecord,
    gameId: -i,
    finished: (i >= 5),
    reason: "install",
    progress: (i + 3) * 0.1,
    totalSize: i * 304138,
    pOsx: (i % 2 === 0),
    order: -i,
  };
}), "id");

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
    indexBy(state.downloads, "gameId")
  ),
});

const selector = createSelector(
  structSel,
  (fields: IDownloadsState) => {
    const {activeDownload} = fields;
    const progress = (activeDownload && activeDownload.progress) || -1;

    return Object.assign({}, fields, {activeDownload, progress});
  }
);

const baseInitialState = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), (x) => ({ bps: 0 })),
  downloads: (process.env.FAKE_DOWNLOADS === "1" ? makeFakeDownloads() : {}),
  downloadsPaused: false,
};
const initialState = Object.assign({}, baseInitialState, selector(baseInitialState));

const updateSingle = (state: IDownloadsState, record: any) => {
  const {downloads} = state;
  const {id} = record;
  invariant(id, "valid download id in progress");

  const download = downloads[id];
  if (!download) {
    // ignore progress messages for inactive downloads
    return state;
  }

  const newDownloads = Object.assign({}, downloads, {
    [id]: Object.assign({}, download, record),
  });
  return Object.assign({}, state, {downloads: newDownloads});
};

const reducer = handleActions<IDownloadsState, any>({
  CLEAR_GAME_DOWNLOADS: (state: IDownloadsState, action: IAction<IClearGameDownloadsPayload>) => {
    const {downloads} = state;
    const {gameId} = action.payload;

    const newDownloads = indexBy(filter(downloads, (x) => x.game.id !== gameId), "id");
    return Object.assign({}, state, {downloads: newDownloads});
  },

  DOWNLOAD_STARTED: (state: IDownloadsState, action: IAction<IDownloadStartedPayload>) => {
    const {downloads} = state;
    const download = action.payload;
    invariant(download.id, "valid download id in started");
    const carryOver = indexBy(filter(downloads, (x) => x.gameId !== download.gameId), "id");
    const newDownloads = Object.assign({}, carryOver, {[download.id]: download});
    return Object.assign({}, state, {downloads: newDownloads});
  },

  DOWNLOAD_PROGRESS: (state: IDownloadsState, action: IAction<IDownloadProgressPayload>) => {
    const record = action.payload;
    return updateSingle(state, record);
  },

  DOWNLOAD_ENDED: (state: IDownloadsState, action: IAction<IDownloadEndedPayload>) => {
    const {id, err} = action.payload;
    return updateSingle(state, {id, finished: true, err});
  },

  DOWNLOAD_SPEED_DATAPOINT: (state: IDownloadsState, action: IAction<IDownloadSpeedDatapointPayload>) => {
    const {payload} = action;

    return Object.assign({}, state, {
      speeds: last([...state.speeds, payload], SPEED_DATA_POINT_COUNT),
    });
  },

  PRIORITIZE_DOWNLOAD: (state: IDownloadsState, action: IAction<IPrioritizeDownloadPayload>) => {
    const {id} = action.payload;
    const {activeDownload} = selector(state);

    if (!activeDownload || activeDownload.id === id) {
      // either no downloads, or only one. nothing to prioritize!
      return state;
    }

    // don't re-number priorities, just go into the negatives
    const order = activeDownload.order - 1;

    return updateSingle(state, {id, order});
  },

  CANCEL_DOWNLOAD: (state: IDownloadsState, action: IAction<ICancelDownloadPayload>) => {
    const {id} = action.payload;
    const {downloads} = state;

    const download = downloads[id];
    invariant(download, "cancelling valid download");

    const newDownloads = omit(downloads, id);
    return Object.assign({}, state, {downloads: newDownloads});
  },

  CLEAR_FINISHED_DOWNLOADS: (state: IDownloadsState, action: IAction<IClearFinishedDownloadsPayload>) => {
    const {downloads} = state;
    const newDownloads = indexBy(filter(downloads, (x) => !x.finished), "id");
    return Object.assign({}, state, {downloads: newDownloads});
  },

  PAUSE_DOWNLOADS: (state: IDownloadsState, action: IAction<IPauseDownloadsPayload>) => {
    return Object.assign({}, state, {downloadsPaused: true});
  },

  RESUME_DOWNLOADS: (state: IDownloadsState, action: IAction<IResumeDownloadsPayload>) => {
    return Object.assign({}, state, {downloadsPaused: false});
  },
}, initialState);

export default derivedReducer(reducer, selector);
