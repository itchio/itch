
import * as invariant from "invariant";

import {EventEmitter} from "events";

import butler from "../../util/butler";
import pathmaker from "../../util/pathmaker";
import client from "../../util/api";

import mklog from "../../util/log";
const log = mklog("download-patches");

import {IDownloadOpts} from "./types";
import {IProgressInfo} from "../../types/progress";

export default async function downloadPatches (out: EventEmitter, opts: IDownloadOpts) {
  const {globalMarket, cave, gameId, totalSize, upgradePath, upload, credentials, downloadKey, logger} = opts;
  invariant(typeof globalMarket === "object", "downloadPatches must have globalMarket");
  invariant(typeof gameId === "number", "downloadPatches must have gameId");
  invariant(typeof upgradePath === "object", "downloadPatches must have an upgradePath");
  invariant(typeof totalSize === "number", "downloadPatches must have a totalSize");
  invariant(typeof upload === "object", "downloadPatches must have upload object");
  invariant(typeof cave === "object", "downloadPatches must have cave");
  invariant(credentials && credentials.key, "downloadPatches has valid key");

  const api = client.withKey(credentials.key);

  let byteOffset = 0;

  for (const entry of upgradePath) {
    log(opts, `Dealing with entry ${JSON.stringify(entry, null, 2)}`);

    const cavePath = pathmaker.appPath(cave);

    const patchPath = api.downloadBuildURL(downloadKey, upload.id, entry.id, "patch");
    const signaturePath = api.downloadBuildURL(downloadKey, upload.id, entry.id, "signature");

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
      logger,
    };

    await butler.apply(butlerOpts);

    const caveUpdate = {
      buildId: entry.id,
      buildUserVersion: entry.userVersion,
      installedArchiveMtime: Date.parse(entry.updatedAt),
    };
    await globalMarket.saveEntity("caves", cave.id, caveUpdate, { wait: true });

    log(opts, `Done applying ${entry.id}`);

    const progress = (byteOffset + entry.patchSize) / totalSize;
    out.emit("progress", {progress});

    byteOffset += entry.patchSize;
  }
}
