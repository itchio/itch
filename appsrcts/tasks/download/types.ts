
import Market from "../../util/market";
import {Logger} from "../../util/log";

import {IUploadRecord, IGameRecord, ICaveRecord, ICredentials, IDownloadKey} from "../../types/db";

export interface IUpgradePathItem {
  id: number;
  userVersion?: string;
  updatedAt: string;
  patchSize: number;
}

export interface IDownloadOpts {
  globalMarket: Market;
  credentials: ICredentials;
  upload: IUploadRecord;
  gameId: number;
  game: IGameRecord;
  downloadKey?: IDownloadKey;
  destPath: string;
  upgradePath?: Array<IUpgradePathItem>;
  cave?: ICaveRecord;
  totalSize?: number;
  logger: Logger;
}
