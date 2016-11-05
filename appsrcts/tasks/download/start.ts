
import * as invariant from "invariant";

import mklog from "../../util/log";
const log = mklog("download"); import pathmaker from "../../util/pathmaker"; import client from "../../util/api";
import butler from "../../util/butler";

import downloadPatches from "./download-patches";

import {EventEmitter} from "events";
import {IDownloadOpts} from "../../types/db";

export default async function start (out: EventEmitter, opts: IDownloadOpts) {
  if (opts.upgradePath && opts.cave) {
    log(opts, "Got an upgrade path, downloading patches");

    return await downloadPatches(out, Object.assign({}, opts, {
      cave: opts.cave,
    }));
  }

  const {upload, destPath, downloadKey, credentials} = opts;

  const api = client.withKey(credentials.key);

  const onProgress = (e: any) => out.emit("progress", e);

  const experimentalDownloads = false;
  if (experimentalDownloads && upload.buildId) {
    log(opts, `Downloading wharf-enabled upload, build #${upload.buildId}`);

    const {game} = opts;
    invariant(game, "startDownload opts must have game");

    // TODO: use manifest URL if available
    const archiveURL = api.downloadBuildURL(downloadKey, upload.id, upload.buildId, "archive");
    const signatureURL = api.downloadBuildURL(downloadKey, upload.id, upload.buildId, "signature");

    const store = require("../../store").default;
    const {defaultInstallLocation} = store.getState().preferences;
    const installLocation = defaultInstallLocation;
    const installFolder = pathmaker.sanitize(game.title);

    const cave = {
      installLocation,
      installFolder,
      pathScheme: 2, // see pathmaker
    };

    const fullInstallFolder = pathmaker.appPath(cave);
    log(opts, `Doing decompressing download to ${fullInstallFolder}`);

    await butler.verify(signatureURL, fullInstallFolder, Object.assign({}, opts, {
      heal: `archive,${archiveURL}`,
      emitter: out,
      onProgress,
    }));
  } else {
    const uploadURL = api.downloadUploadURL(downloadKey, upload.id);

    try {
      await butler.cp(Object.assign({}, opts, {
        src: uploadURL,
        dest: destPath,
        resume: true,
        emitter: out,
        onProgress,
      }));
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
