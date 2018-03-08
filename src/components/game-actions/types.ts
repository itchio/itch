import { ClassificationAction, ITask, IDownloadItem } from "../../types";
import { Game, CaveSummary, DownloadKey } from "../../buse/messages";

export interface IActionsInfo {
  cave: CaveSummary;
  game: Game;
  downloadKey: DownloadKey;

  action: ClassificationAction;

  mayDownload: boolean;
  canBeBought: boolean;

  tasks: ITask[];
  downloads: IDownloadItem[];
}
