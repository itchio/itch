import { createStructuredSelector } from "reselect";

import { indexBy, map, last, omit } from "underscore";
import groupIdBy from "../helpers/group-id-by";
import {
  getActiveDownload,
  getPendingDownloads,
  excludeGame,
} from "../reactors/downloads/getters";

import { IDownloadsState, IDownloadItem } from "../types";

import reducer from "./reducer";
import derivedReducer from "./derived-reducer";
import * as actions from "../actions";

const SPEED_DATA_POINT_COUNT = 60;

const selector = createStructuredSelector({
  itemIdsByGameId: (state: IDownloadsState) =>
    groupIdBy<IDownloadItem>(state.items, i => String(i.game && i.game.id)),
});

const baseInitialState = {
  speeds: map(new Array(SPEED_DATA_POINT_COUNT), x => 0),
  items: {},
  paused: false,
};
const initialState = { ...baseInitialState, ...selector(baseInitialState) };

const updateSingle = (state: IDownloadsState, record: any): IDownloadsState => {
  const { items } = state;
  const { id } = record;

  const item = items[id];
  if (!item) {
    // ignore progress messages for inactive downloads
    return state;
  }

  return {
    ...state,
    items: {
      ...state.items,
      [id]: {
        ...item,
        ...record,
      },
    },
  };
};

function index(items: IDownloadItem[]): IDownloadsState["items"] {
  return indexBy(items, "id");
}

const baseReducer = reducer<IDownloadsState>(initialState, on => {
  on(actions.clearGameDownloads, (state, action) => {
    const { gameId } = action.payload;
    return {
      ...state,
      items: index(excludeGame(state, gameId)),
    };
  });

  on(actions.downloadStarted, (state, action) => {
    const item = action.payload as IDownloadItem;

    return {
      ...state,
      items: {
        ...index(excludeGame(state, item.game.id)),
        [item.id]: item,
      },
    };
  });

  on(actions.retryDownload, (state, action) => {
    const { id } = action.payload;

    return updateSingle(state, {
      id,
      finished: false,
    });
  });

  on(actions.downloadProgress, (state, action) => {
    const record = action.payload;
    return updateSingle(state, record);
  });

  on(actions.downloadEnded, (state, action) => {
    const { id, finishedAt, err, errStack } = action.payload;
    return updateSingle(state, {
      id,
      finished: true,
      finishedAt,
      progress: 0,
      eta: 0,
      bps: 0,
      err,
      errStack,
    });
  });

  on(actions.downloadSpeedDatapoint, (state, action) => {
    const { bps } = action.payload;

    return {
      ...state,
      speeds: last([...state.speeds, bps], SPEED_DATA_POINT_COUNT),
    };
  });

  on(actions.prioritizeDownload, (state, action) => {
    const { id } = action.payload;
    const activeDownload = getActiveDownload(state);

    if (!activeDownload || activeDownload.id === id) {
      // either no downloads, or only one. nothing to prioritize!
      return state;
    }

    // don't re-number priorities, just go into the negatives
    const order = activeDownload.order - 1;

    return updateSingle(state, { id, order });
  });

  on(actions.downloadDiscarded, (state, action) => {
    const { id } = action.payload;
    const { items } = state;

    const item = items[id];
    if (!item) {
      /** we don't know about it! */
      return state;
    }

    return {
      ...state,
      items: omit(state.items, id),
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
      items: index(map(state.items, i => ({ ...i, bps: 0 }))),
      paused: false,
    };
  });
});

export default derivedReducer(baseReducer, selector);
