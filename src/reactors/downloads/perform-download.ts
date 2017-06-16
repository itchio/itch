
import * as paths from "../../os/paths";
import client from "../../api";
import butler from "../../util/butler";

import db from "../../db";

import rootLogger from "../../logger";

import downloadPatches from "./download-patches";
import getGameCredentials from "./get-game-credentials";

import {EventEmitter} from "events";

import {IStore, IDownloadItem, IDownloadResult} from "../../types";

export default async function performDownload
    (store: IStore, item: IDownloadItem, out: EventEmitter): Promise<IDownloadResult> {

  // TODO: we want to store download/install logs even if the cave never ends
  // up being valid, for bug reporting purposes.

  let parentLogger = rootLogger;
  if (item.caveId) {
    parentLogger = paths.caveLogger(item.caveId);
  }
  const logger = parentLogger.child({name: `download`});

  if (item.upgradePath && item.caveId) {
    logger.info("Got an upgrade path, downloading patches");

    return await downloadPatches(store, item, out, logger);
  }

  const {upload, downloadKey, game, caveId} = item;

  const gameCredentials = await getGameCredentials(store, game);
  if (!gameCredentials) {
    throw new Error(`no game credentials, can't download`);
  }

  const api = client.withKey(gameCredentials.apiKey);

  const {preferences} = store.getState();

  const onProgress = (e: any) => out.emit("progress", e);

  const archivePath = paths.downloadPath(upload, preferences);

  if (isHeal(item)) {
    const buildId = upload.buildId;

    logger.info(`Downloading wharf-enabled download, build #${buildId}`);

    const archiveURL = api.downloadBuildURL(downloadKey, upload.id, buildId, "archive");
    const signatureURL = api.downloadBuildURL(downloadKey, upload.id, buildId, "signature");

    const cave = await db.caves.findOneById(caveId);

    const fullInstallFolder = paths.appPath(cave, preferences);
    logger.info(`Doing verify+heal to ${fullInstallFolder}`);

    await butler.verify(signatureURL, fullInstallFolder, {
      logger,
      heal: `archive,${archiveURL}`,
      emitter: out,
      onProgress,
    });
 } else {
    const uploadURL = api.downloadUploadURL(downloadKey, upload.id);

    try {
      await butler.cp({
        src: uploadURL,
        dest: archivePath,
        resume: true,
        emitter: out,
        logger,
        onProgress,
      });
    } catch (e) {
      if (e.errors && e.errors[0] === "invalid upload") {
        const e = new Error("invalid upload");
        (e as any).itchReason = "upload-gone";
        throw e;
      }
      throw e;
    }
  }

  return {
    archivePath,
  };
}

function isHeal (item: IDownloadItem): boolean {
  switch (item.reason) {
    case "heal":
    case "revert":
      return true;
    case "update":
      if (item.upgradePath) {
        return true;
      }
    default:
      return false;
  }
}
