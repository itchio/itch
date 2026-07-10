import { RootState, Task, TaskName } from "common/types";

import { first, findWhere, size } from "underscore";
import getByIds from "common/helpers/get-by-ids";
import {
  getPendingForGame,
  getActiveDownload,
} from "main/reactors/downloads/getters";
import { memoize } from "common/util/lru-memoize";
import {
  Game,
  CaveSummary,
  DownloadKeySummary,
  Download,
  DownloadProgress,
  DownloadReason,
} from "common/butlerd/messages";
import { GameUpdate } from "common/butlerd/messages";

/**
 * What type of access we have to the game - do we own it,
 * have we created it, have we bought it, etc.
 */
export enum Access {
  /**
   * Game cannot be bought
   */
  Free,

  /**
   * Game is pay-what-you-want
   */
  Pwyw,

  /**
   * Game has a demo that can be downloaded for free
   */
  Demo,

  /**
   * Game is in press system and so are we
   */
  Press,

  /**
   * We have a download key for the game
   */
  Key,

  /**
   * We have edit rights on the game page
   */
  Edit,

  /**
   * We have no access to the game whatsoever
   */
  None,
}

export enum OperationType {
  /** The current operation is a download */
  Download,

  /** The current operation is a task */
  Task,
}

export interface Operation {
  type: OperationType;
  name?: TaskName;
  id?: string;
  reason?: DownloadReason;
  active: boolean;
  paused: boolean;
  /** null when a download exists but progress info hasn't arrived yet */
  progress: number | null;
  bps?: number | null;
  eta?: number | null;
  stage?: string | null;
}

export interface GameStatus {
  /** undefined if the profile owns no key for this game */
  downloadKey: DownloadKeySummary | undefined;
  /** undefined if the game is not installed */
  cave: CaveSummary | undefined;
  numCaves: number;
  access: Access;
  /** null if no task or download is in progress */
  operation: Operation | null;
  /** undefined if no update is available (or the game is not installed) */
  update: GameUpdate | undefined;
}

/**
 * Overlays ownership known from outside of commons (e.g. bundle ownership
 * reported by Fetch.GameOwnership) on top of a computed GameStatus, so
 * games owned through unmaterialized bundles show as installable instead
 * of purchasable.
 */
export function withOwnedAccess(status: GameStatus): GameStatus {
  if (status.access === Access.None) {
    return rawWithOwnedAccess(status);
  }
  return status;
}
const rawWithOwnedAccess = memoize(300, (status: GameStatus): GameStatus => {
  return { ...status, access: Access.Key };
});

function getGameStatus(rs: RootState, game: Game, caveId?: string): GameStatus {
  const { commons, tasks, downloads } = rs;
  const { profile } = rs.profile;
  if (!profile) {
    // game status is only queried from logged-in views; reading
    // profile.user below would have thrown anyway
    throw new Error("getGameStatus called before login");
  }

  let downloadKeys = getByIds(
    commons.downloadKeys,
    commons.downloadKeyIdsByGameId[game.id]
  );

  let cave: CaveSummary | undefined;
  let numCaves = 0;
  if (caveId) {
    cave = commons.caves[caveId];
  } else {
    let caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);
    numCaves = size(caves);
    cave = first(caves);
  }
  const downloadKey = first(downloadKeys);

  const pressUser = profile.user.pressUser;
  const task = first(tasks.tasksByGameId[game.id]);

  const pendingDownloads = getPendingForGame(downloads, game.id);
  let download: Download | undefined;
  if (caveId) {
    download = findWhere(pendingDownloads, { caveId });
  } else {
    download = first(pendingDownloads);
  }

  let isActiveDownload = false;
  let areDownloadsPaused = false;
  let downloadProgress: DownloadProgress | undefined;
  if (download) {
    const activeDownload = getActiveDownload(downloads);
    isActiveDownload = download.id === activeDownload?.id;
    areDownloadsPaused = downloads.paused;
    downloadProgress = downloads.progresses[download.id];
  }

  let update: GameUpdate | undefined;
  if (cave) {
    update = rs.gameUpdates.updates[cave.id];
  }

  const profileId = profile.id;

  return realGetGameStatus(
    game,
    cave,
    numCaves,
    downloadKey,
    pressUser,
    task,
    download,
    downloadProgress,
    update,
    isActiveDownload,
    areDownloadsPaused,
    profileId
  );
}

export default getGameStatus;

function rawGetGameStatus(
  game: Game,
  cave: CaveSummary | undefined,
  numCaves: number,
  downloadKey: DownloadKeySummary | undefined,
  pressUser: boolean,
  task: Task | undefined,
  download: Download | undefined,
  downloadProgress: DownloadProgress | undefined,
  update: GameUpdate | undefined,
  isDownloadActive: boolean,
  areDownloadsPaused: boolean,
  profileId: number
): GameStatus {
  let access = Access.None;

  if (game.userId == profileId) {
    access = Access.Edit;
  } else {
    const hasPrice = (game.minPrice ?? 0) > 0;
    if (!hasPrice) {
      if (game.canBeBought) {
        access = Access.Pwyw;
      } else {
        access = Access.Free;
      }
    } else {
      // game has minimum price
      if (downloadKey) {
        // we have download keys
        access = Access.Key;
      } else {
        // we have no download keys
        if (game.inPressSystem && pressUser) {
          access = Access.Press;
        } else {
          // we have.. nothing
        }
      }
    }
  }

  let operation: Operation | null = null;

  if (task) {
    operation = {
      type: OperationType.Task,
      name: task.name,
      active: true,
      paused: false,
      progress: task.progress,
      eta: task.eta,
      bps: task.bps,
    };
  } else if (download) {
    let p = downloadProgress || {
      progress: null,
      eta: null,
      bps: null,
      stage: null,
    };
    operation = {
      type: OperationType.Download,
      id: download.id,
      reason: download.reason,
      active: isDownloadActive,
      paused: areDownloadsPaused,
      progress: p.progress,
      eta: p.eta,
      bps: p.bps,
      stage: p.stage,
    };
  }

  return {
    cave,
    numCaves,
    downloadKey,
    access,
    operation,
    update,
  };
}
const realGetGameStatus = memoize(300, rawGetGameStatus);
