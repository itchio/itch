
import {EventEmitter} from "events";

import {Logger} from "../logger";

import butler from "../../util/butler";
import * as paths from "../../os/paths";
import client from "../../api";

import {
  IStore,
  IProgressInfo,
  IDownloadItem,
  IDownloadResult,
} from "../../types";
import {IDownloadBuildFileExtras} from "../../types/api";

import store from "../../store/metal-store";

export default async function downloadPatches (
    store: IStore, item: IDownloadItem, out: EventEmitter, parentLogger: Logger): Promise<IDownloadResult> {

  const {cave, totalSize, upgradePath, upload, downloadKey} = item;
  const logger = parentLogger.child({name: "download-patches"});
  const globalMarket: any = null;

  // TODO: implement `credentialsForGame`
  const {credentials} = store.getState().session;

  const api = client.withKey(credentials.key);

  const patchExtras: IDownloadBuildFileExtras = {};
  const {preferences} = store.getState();
  if (preferences.preferOptimizedPatches) {
    patchExtras.prefer_optimized = 1;
  }

  let byteOffset = 0;
  logger.info(`Downloading ${upgradePath.length} patches, extras: ${JSON.stringify(patchExtras, null, 2)})`);

  for (const entry of upgradePath) {
    logger.info(`Dealing with upgrade entry ${JSON.stringify(entry, null, 2)}`);

    const cavePath = paths.appPath(cave, preferences);

    const patchPath = api.downloadBuildURL(downloadKey, upload.id, entry.id, "patch", patchExtras);
    const signaturePath = api.downloadBuildURL(downloadKey, upload.id, entry.id, "signature");
    const archivePath = api.downloadBuildURL(downloadKey, upload.id, entry.id, "archive");

    const applyProgress = (e: IProgressInfo) => {
      const entryProgress = e.progress;
      const progress = (byteOffset + (entryProgress * entry.patchSize)) / totalSize;
      out.emit("progress", {progress});
    };

    // TODO: if this is interrupted, it has to restart the current patch from the beginning.
    // Maybe httpfile should have some kind of persistence? That's a whole 'nother can of worms though.

    logger.info(`Applying ${entry.id} into ${cavePath}`);
    const butlerOpts = {
      emitter: out,
      onProgress: applyProgress,
      patchPath,
      signaturePath,
      outPath: cavePath,
      archivePath,
      logger,
    };

    await butler.apply(butlerOpts);

    const caveUpdate = {
      buildId: entry.id,
      buildUserVersion: entry.userVersion,
      installedArchiveMtime: entry.updatedAt,
      uploads: {
        [upload.id]: {
          ...upload,
          buildId: entry.id,
        },
      },
    };
    await globalMarket.saveEntity("caves", cave.id, caveUpdate, { wait: true });

    logger.info(`Done applying ${entry.id}`);

    const progress = (byteOffset + entry.patchSize) / totalSize;
    out.emit("progress", {progress});

    byteOffset += entry.patchSize;
  }

  return ;
}
