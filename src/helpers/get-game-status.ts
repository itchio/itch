import { IDownloadKeySummary } from "../db/models/download-key";
import { ICaveSummary } from "../db/models/cave";
import { IRootState, IGameUpdate, ITask, IDownloadItem } from "../types/index";

import { first } from "underscore";
import getByIds from "./get-by-ids";
import { IGame } from "../db/models/game";
import {
  getPendingForGame,
  getActiveDownload,
} from "../reactors/downloads/getters";
import isPlatformCompatible from "../util/is-platform-compatible";
import memoize from "../util/lru-memoize";
import { TaskName, DownloadReason } from "../types/tasks";

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

export interface IOperation {
  type: OperationType;
  name?: TaskName;
  id?: string;
  reason?: DownloadReason;
  active: boolean;
  paused: boolean;
  progress: number;
  bps?: number;
  eta?: number;
}

export interface IGameStatus {
  downloadKey: IDownloadKeySummary;
  cave: ICaveSummary;
  access: Access;
  operation: IOperation;
  update: IGameUpdate;
  compatible: boolean;
}

export default function getGameStatus(
  rs: IRootState,
  game: IGame
): IGameStatus {
  const { commons, session, tasks, downloads } = rs;
  const { credentials } = session;

  let caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);
  let downloadKeys = getByIds(
    commons.downloadKeys,
    commons.downloadKeyIdsByGameId[game.id]
  );

  const cave = first(caves);
  const downloadKey = first(downloadKeys);

  const pressUser = credentials.me.pressUser;
  const task = first(tasks.tasksByGameId[game.id]);
  const download = first(getPendingForGame(downloads, game.id));
  let isActiveDownload = false;
  let areDownloadsPaused = false;
  if (download) {
    const activeDownload = getActiveDownload(downloads);
    isActiveDownload = download.id === activeDownload.id;
    areDownloadsPaused = downloads.paused;
  }

  let update: IGameUpdate;
  if (cave) {
    update = rs.gameUpdates.updates[cave.id];
  }

  return realGetGameStatus(
    game,
    cave,
    downloadKey,
    pressUser,
    task,
    download,
    update,
    isActiveDownload,
    areDownloadsPaused
  );
}

function rawGetGameStatus(
  game: IGame,
  cave: ICaveSummary,
  downloadKey: IDownloadKeySummary,
  pressUser: boolean,
  task: ITask,
  download: IDownloadItem,
  update: IGameUpdate,
  isDownloadActive,
  areDownloadsPaused
): IGameStatus {
  let access = Access.None;
  if (!(game.minPrice > 0)) {
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
        // we have
      }
    }
  }

  let operation: IOperation = null;

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
    operation = {
      type: OperationType.Download,
      id: download.id,
      reason: download.reason,
      active: isDownloadActive,
      paused: areDownloadsPaused,
      progress: download.progress,
      eta: download.eta,
      bps: download.bps,
    };
  }

  const compatible = isPlatformCompatible(game);
  return {
    cave,
    downloadKey,
    access,
    operation,
    update,
    compatible,
  };
}
const realGetGameStatus = memoize(300, rawGetGameStatus);
