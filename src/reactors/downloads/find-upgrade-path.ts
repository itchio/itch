
import {EventEmitter} from "events";

import client from "../../api";
import rootLogger from "../../logger";
const logger = rootLogger.child({name: "find-upgrade-path"});

import Game from "../../db/models/game";

import {
  IStore,
  IUploadRecord,
  IUpgradePathItem,
  IGameCredentials,
} from "../../types";

interface IFindUpgradePathOpts {
  game: Game;
  upload: IUploadRecord;
  currentBuildId: number;
  gameCredentials: IGameCredentials;
}

export interface IFindUpgradePathResult {
  upgradePath: IUpgradePathItem[];
  totalSize: number;
};

export default async function findUpgradePath (
    store: IStore, out: EventEmitter, opts: IFindUpgradePathOpts): Promise<IFindUpgradePathResult> {

  const {gameCredentials, upload, currentBuildId} = opts;

  if (!gameCredentials) {
    return null;
  }

  const api = client.withKey(gameCredentials.apiKey);

  if (gameCredentials.downloadKey) {
    logger.info("bought game, using download key");
  } else {
    logger.info("no download key, seeking free/own uploads");
  }
  const response = await api.findUpgrade(gameCredentials.downloadKey, upload.id, currentBuildId);

  let upgradePath = response.upgradePath;

  // current build is the 1st element of the upgrade path
  upgradePath.shift();

  logger.info(`Got upgrade path: ${JSON.stringify(upgradePath, null, 2)}`);

  let totalSize = 0;
  for (const entry of upgradePath) {
    totalSize += entry.patchSize;
  }

  return {upgradePath, totalSize};
}
