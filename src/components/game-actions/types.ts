
import GameModel from "../../models/game";
import CaveModel from "../../models/cave";

import {
  IDownloadKey, ClassificationAction,
  ITask, IDownloadItem,
} from "../../types";

export interface IActionsInfo {
  cave: CaveModel;
  game: GameModel;
  downloadKey: IDownloadKey;
  
  action: ClassificationAction;

  mayDownload: boolean;
  canBeBought: boolean;

  tasks: ITask[];
  downloads: IDownloadItem[];
}
