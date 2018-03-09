import { createStructuredSelector } from "reselect";

import {
  indexBy,
  map,
  last,
  omit,
  min,
  max,
  isEmpty,
  values,
} from "underscore";
import groupIdBy from "../helpers/group-id-by";
import { excludeGame } from "../reactors/downloads/getters";

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
  paused: true,
  restored: false,
};
const initialState: IDownloadsState = {
  ...baseInitialState,
  ...selector(baseInitialState),
};

const updateSingle = (
  state: IDownloadsState,
  record: Partial<Download>
): IDownloadsState => {
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

function index(items: Download[]): IDownloadsState["items"] {
  return indexBy(items, "id");
}

// higher priority = smaller numbers
function higherPriorityPosition(state: IDownloadsState): number {
  if (isEmpty(state.items)) {
    return 0;
  }
  return min(values(state.items), x => x.position).position - 1;
}

// lower priority = larger numbers
function lowerPriorityPosition(state: IDownloadsState): number {
  if (isEmpty(state.items)) {
    return 0;
  }
  return max(values(state.items), x => x.position).position + 1;
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
    const item = action.payload as Download;
    const rank = higherPriorityPosition(state);

    return {
      ...state,
      items: {
        ...index(excludeGame(state, item.game.id)),
        [item.id]: {
          ...item,
          rank,
        },
      },
    };
  });

  on(actions.retryDownload, (state, action) => {
    const { id } = action.payload;

    const { items } = state;
    const item = items[id];

    if (!item) {
      // can't retry item we don't know about
      return;
    }

    return updateSingle(state, {
      id,
      position: lowerPriorityPosition(state),
      finishedAt: null,
    });
  });

  on(actions.downloadProgress, (state, action) => {
    const record = action.payload;
    return updateSingle(state, record);
  });

  on(actions.downloadEnded, (state, action) => {
    const { id, finishedAt } = action.payload;
    return updateSingle(state, {
      id,
      finishedAt,
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

    return updateSingle(state, { id, position: higherPriorityPosition(state) });
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

  on(actions.downloadsRestored, (state, action) => {
    return {
      ...state,
      restored: true,
    };
  });
});

export default derivedReducer(baseReducer, selector);
