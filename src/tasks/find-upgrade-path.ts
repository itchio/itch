
import {EventEmitter} from "events";
import * as invariant from "invariant";

import client from "../api";
import rootLogger from "../logger";
const logger = rootLogger.child("find-upgrade-path");

import {each} from "underscore";

import {IUploadRecord, ICredentials, IDownloadKey} from "../types";

interface IFindUpgradePathOpts {
  credentials: ICredentials;
  downloadKey?: IDownloadKey;
  gameId: number;
  market: IDB;
  upload: IUploadRecord;
  currentBuildId: number;
}

export default async function start (out: EventEmitter, opts: IFindUpgradePathOpts) {
  const {credentials, market, upload, downloadKey, gameId, currentBuildId} = opts;
  invariant(typeof gameId === "number", "find-upgrade-path has gameId");
  invariant(typeof market === "object", "find-upgrade-path has market");
  invariant(typeof upload === "object", "find-upgrade-path has upload");
  invariant(currentBuildId, "find-upgrade-path has currentBuildId");

  invariant(credentials && credentials.key, "find-upgrade-path has valid key");
  const api = client.withKey(credentials.key);

  if (downloadKey) {
    logger.info("bought game, using download key");
  } else {
    logger.info("no download key, seeking free/own uploads");
  }
  const response = await api.findUpgrade(downloadKey, upload.id, currentBuildId);

  let upgradePath = response.upgradePath;

  // current build is the 1st element of the upgrade path
  upgradePath.shift();

  logger.info(`Got upgrade path: ${JSON.stringify(upgradePath, null, 2)}`);

  let totalSize = 0;
  each(upgradePath, (entry) => {
    totalSize += entry.patchSize;
  });

  return {upgradePath, totalSize};
}
