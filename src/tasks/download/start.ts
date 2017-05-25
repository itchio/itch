
import * as invariant from "invariant";

import * as paths from "../../os/paths";
import client from "../../api";
import butler from "../../util/butler";

import downloadPatches from "./download-patches";

import {EventEmitter} from "events";
import {IDownloadOpts} from "../../types";

import store from "../../store/metal-store";

export default async function start (out: EventEmitter, inOpts: IDownloadOpts) {
  let opts = inOpts;
  if (opts.cave) {
    opts = {
      ...opts,
      logger: paths.caveLogger(opts.cave.id),
    };
  }
  const {logger} = opts;

  if (opts.upgradePath && opts.cave) {
    logger.info("Got an upgrade path, downloading patches");

    return await downloadPatches(out, {
      ...opts,
      cave: opts.cave,
    });
  }

  const {upload, destPath, downloadKey, credentials, password, secret} = opts;

  const api = client.withKey(credentials.key);

  const onProgress = (e: any) => out.emit("progress", e);

  if (opts.heal) {
    const buildId = upload.buildId;

    logger.info(`Downloading wharf-enabled download, build #${buildId}`);

    const {game} = opts;
    invariant(game, "startDownload opts must have game");

    // TODO: use manifest URL if available
    const archiveURL = api.downloadBuildURL(downloadKey, upload.id, buildId, "archive", {password, secret});
    const signatureURL = api.downloadBuildURL(downloadKey, upload.id, buildId, "signature", {password, secret});

    const {preferences} = store.getState();
    const {defaultInstallLocation} = preferences;
    const installLocation = defaultInstallLocation;
    const installFolder = paths.sanitize(game.title);

    const cave = opts.cave || {
      installLocation,
      installFolder,
      pathScheme: paths.PathScheme.MODERN_SHARED, // see paths
    };

    const fullInstallFolder = paths.appPath(cave, preferences);
    logger.info(`Doing verify+heal to ${fullInstallFolder}`);

    await butler.verify(signatureURL, fullInstallFolder, {
      logger,
      heal: `archive,${archiveURL}`,
      emitter: out,
      onProgress,
    });
 } else {
    const uploadURL = api.downloadUploadURL(downloadKey, upload.id, {password, secret});

    try {
      await butler.cp({
        src: uploadURL,
        dest: destPath,
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
}
