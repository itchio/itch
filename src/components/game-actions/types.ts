import { IGame } from "../../db/models/game";
import { ICave } from "../../db/models/cave";
import { IDownloadKey } from "../../db/models/download-key";

import { ClassificationAction, ITask, IDownloadItem } from "../../types";

export interface IActionsInfo {
  cave: ICave;
  game: IGame;
  downloadKey: IDownloadKey;

  action: ClassificationAction;

  mayDownload: boolean;
  canBeBought: boolean;

  tasks: ITask[];
  downloads: IDownloadItem[];
}
