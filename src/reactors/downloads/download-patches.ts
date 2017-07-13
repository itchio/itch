import { Logger } from "../../logger";

import butler from "../../util/butler";
import * as paths from "../../os/paths";
import client from "../../api";

import Context from "../../context";

import { IDownloadItem, IDownloadResult, IGameCredentials } from "../../types";
import { IDownloadBuildFileExtras } from "../../types/api";

interface IDownloadPatchesOpts {
  ctx: Context;
  credentials: IGameCredentials;
  item: IDownloadItem;
  logger: Logger;
}

export default async function downloadPatches(
  opts: IDownloadPatchesOpts,
): Promise<IDownloadResult> {
  const { ctx, credentials, item } = opts;
  const { caveId, totalSize, upgradePath, upload } = item;
  const logger = opts.logger.child({ name: "download-patches" });

  const api = client.withKey(credentials.apiKey);

  const cave = ctx.db.caves.findOneById(caveId);
  if (!cave) {
    throw new Error("Can't download patches if we have no cave");
  }

  const patchExtras: IDownloadBuildFileExtras = {};
  const { preferences } = ctx.store.getState();
  if (preferences.preferOptimizedPatches) {
    patchExtras.prefer_optimized = 1;
  }

  let byteOffset = 0;
  logger.info(
    `Downloading ${upgradePath.length} patches, extras: ${JSON.stringify(
      patchExtras,
      null,
      2,
    )})`,
  );

  for (const entry of upgradePath) {
    logger.info(`Dealing with upgrade entry ${JSON.stringify(entry, null, 2)}`);

    const cavePath = paths.appPath(cave, preferences);

    const patchPath = api.downloadBuildURL(
      credentials.downloadKey,
      upload.id,
      entry.id,
      "patch",
      patchExtras,
    );
    const signaturePath = api.downloadBuildURL(
      credentials.downloadKey,
      upload.id,
      entry.id,
      "signature",
    );
    const archivePath = api.downloadBuildURL(
      credentials.downloadKey,
      upload.id,
      entry.id,
      "archive",
    );

    // TODO: if this is interrupted, it has to restart the current patch from the beginning.
    // Maybe httpfile should have some kind of persistence? That's a whole 'nother can of worms though.

    logger.info(`Applying ${entry.id} into ${cavePath}`);

    await ctx.withSub(async applyCtx => {
      applyCtx.on("progress", e => {
        const entryProgress = e.progress;
        const progress =
          (byteOffset + entryProgress * entry.patchSize) / totalSize;
        ctx.emitProgress({ progress });
      });

      await butler.apply({
        ctx: applyCtx,
        patchPath,
        signaturePath,
        outPath: cavePath,
        archivePath,
        logger,
      });
    });

    ctx.db.saveOne("caves", cave.id, {
      buildId: entry.id,
      buildUserVersion: entry.userVersion,
      installedArchiveMtime: entry.updatedAt,
      upload: {
        ...upload,
        buildId: entry.id,
      },
    });

    logger.info(`Done applying ${entry.id}`);

    const progress = (byteOffset + entry.patchSize) / totalSize;
    ctx.emitProgress({ progress });

    byteOffset += entry.patchSize;
  }

  return;
}
