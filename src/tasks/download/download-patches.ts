
import {EventEmitter} from "events";

import butler from "../../util/butler";
import pathmaker from "../../util/pathmaker";
import client from "../../util/api";

import mklog from "../../util/log";
const log = mklog("download-patches");

import {IDownloadOpts, IProgressInfo} from "../../types";
import {IDownloadBuildFileExtras} from "../../types/api";

import {getGlobalMarket} from "../../reactors/market";

import store from "../../store/metal-store";

export default async function downloadPatches (out: EventEmitter, opts: IDownloadOpts) {
  const {cave, totalSize, upgradePath, upload, credentials, downloadKey, logger} = opts;
  const globalMarket = getGlobalMarket();

  const api = client.withKey(credentials.key);

  const patchExtras: IDownloadBuildFileExtras = {};
  const {preferences} = store.getState();
  if (preferences.preferOptimizedPatches) {
    patchExtras.prefer_optimized = 1;
  }

  let byteOffset = 0;
  log(opts, `Downloading ${upgradePath.length} patches, extras: ${JSON.stringify(patchExtras, null, 2)})`);

  for (const entry of upgradePath) {
    log(opts, `Dealing with upgrade entry ${JSON.stringify(entry, null, 2)}`);

    const cavePath = pathmaker.appPath(cave, preferences);

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

    log(opts, `Applying ${entry.id} into ${cavePath}`);
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

    log(opts, `Done applying ${entry.id}`);

    const progress = (byteOffset + entry.patchSize) / totalSize;
    out.emit("progress", {progress});

    byteOffset += entry.patchSize;
  }
}
