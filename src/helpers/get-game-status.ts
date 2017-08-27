import { IDownloadKeySummary } from "../db/models/download-key";
import { ICaveSummary } from "../db/models/cave";
import { IAppState, IGameUpdate } from "../types/index";

import { first, isEmpty } from "underscore";
import getByIds from "./get-by-ids";
import { IGame } from "../db/models/game";
import {
  getPendingForGame,
  getActiveDownload,
} from "../reactors/downloads/getters";
import isPlatformCompatible from "../util/is-platform-compatible";

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

interface IOperation {
  type: OperationType;
  name?: string;
  reason?: string;
  active: boolean;
  paused: boolean;
  progress: number;
}

export interface IGameStatus {
  downloadKeys: IDownloadKeySummary[];
  downloadKey: IDownloadKeySummary;
  caves: ICaveSummary[];
  cave: ICaveSummary;
  access: Access;
  operation: IOperation;
  update: IGameUpdate;
  compatible: boolean;
}

export default function getGameStatus(rs: IAppState, game: IGame): IGameStatus {
  const { commons, session, tasks, downloads } = rs;
  const { credentials } = session;

  let caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);
  let downloadKeys = getByIds(
    commons.downloadKeys,
    commons.downloadKeyIdsByGameId[game.id]
  );

  const cave = first(caves);
  const downloadKey = first(downloadKeys);

  let access = Access.None;
  if (!(game.minPrice > 0)) {
    if (game.canBeBought) {
      access = Access.Pwyw;
    } else {
      access = Access.Free;
    }
  } else {
    // game has minimum price
    if (isEmpty(downloadKeys)) {
      // we have no download keys
      if (game.inPressSystem && credentials.me.pressUser) {
        access = Access.Press;
      } else {
        // we have
      }
    } else {
      // we have download keys
      access = Access.Key;
    }
  }

  let operation: IOperation = null;

  const download = first(getPendingForGame(downloads, game.id));
  if (download) {
    const activeDownload = getActiveDownload(downloads);
    operation = {
      type: OperationType.Download,
      reason: download.reason,
      active: download.id === activeDownload.id,
      paused: rs.downloads.paused,
      progress: download.progress,
    };
  } else {
    const task = first(tasks.tasksByGameId[game.id]);
    if (task) {
      operation = {
        type: OperationType.Task,
        name: task.name,
        active: true,
        paused: false,
        progress: task.progress,
      };
    }
  }

  let update: IGameUpdate;
  if (cave) {
    update = rs.gameUpdates.updates[cave.id];
  }

  const compatible = isPlatformCompatible(game);
  return {
    caves,
    downloadKeys,
    cave,
    downloadKey,
    access,
    operation,
    update,
    compatible,
  };
}
