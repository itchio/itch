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
  progress: number;
  bps?: number;
  eta?: number;
  stage?: string;
}

export interface GameStatus {
  downloadKey: DownloadKeySummary;
  cave: CaveSummary;
  numCaves: number;
  access: Access;
  operation: Operation;
  update: GameUpdate;
}

function getGameStatus(rs: RootState, game: Game, caveId?: string): GameStatus {
  const { commons, tasks, downloads } = rs;
  const { profile } = rs.profile;

  let downloadKeys = getByIds(
    commons.downloadKeys,
    commons.downloadKeyIdsByGameId[game.id]
  );

  let cave: CaveSummary;
  let numCaves = 0;
  if (!cave) {
    if (caveId) {
      cave = commons.caves[caveId];
    } else {
      let caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);
      numCaves = size(caves);
      cave = first(caves);
    }
  }
  const downloadKey = first(downloadKeys);

  const pressUser = profile.user.pressUser;
  const task = first(tasks.tasksByGameId[game.id]);

  const pendingDownloads = getPendingForGame(downloads, game.id);
  let download: Download;
  if (caveId) {
    download = findWhere(pendingDownloads, { caveId });
  } else {
    download = first(pendingDownloads);
  }

  let isActiveDownload = false;
  let areDownloadsPaused = false;
  let downloadProgress: DownloadProgress;
  if (download) {
    const activeDownload = getActiveDownload(downloads);
    isActiveDownload = download.id === activeDownload.id;
    areDownloadsPaused = downloads.paused;
    downloadProgress = downloads.progresses[download.id];
  }

  let update: GameUpdate;
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
  cave: CaveSummary,
  numCaves: number,
  downloadKey: DownloadKeySummary,
  pressUser: boolean,
  task: Task,
  download: Download,
  downloadProgress: DownloadProgress,
  update: GameUpdate,
  isDownloadActive: boolean,
  areDownloadsPaused: boolean,
  profileId: number
): GameStatus {
  let access = Access.None;

  if (game.userId == profileId) {
    access = Access.Edit;
  } else {
    const hasPrice = game.minPrice > 0;
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

  let operation: Operation = null;

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
