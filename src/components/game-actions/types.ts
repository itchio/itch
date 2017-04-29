
import {
  ICaveRecord, IGameRecord, IDownloadKey, ClassificationAction,
  ITask, IDownloadItem,
} from "../../types";

export interface IActionsInfo {
  cave: ICaveRecord;
  game: IGameRecord;
  downloadKey: IDownloadKey;
  
  action: ClassificationAction;

  mayDownload: boolean;
  canBeBought: boolean;

  tasks: ITask[];
  downloads: IDownloadItem[];
}
