
import {ICaveRecord, IGameRecord, IDownloadKey, ClassificationAction} from "../../types";

export interface IActionsInfo {
  cave: ICaveRecord;
  game: IGameRecord;
  task: string;
  downloadKey: IDownloadKey;
  
  action: ClassificationAction;

  mayDownload: boolean;
  canBeBought: boolean;
}
