
import {EventEmitter} from "events";

import pathmaker from "../util/pathmaker";

import sf from "../util/sf";
import mklog from "../util/log";
const log = mklog("uninstall");

import core from "./install/core";

const keepArchives = (process.env.REMEMBER_ME_WHEN_IM_GONE === "1");

import {IStartTaskOpts, IUploadRecord} from "../types";
import {IProgressInfo} from "../types";

export default async function start (out: EventEmitter, opts: IStartTaskOpts) {
  const {cave, globalMarket} = opts;

  const onProgress = (e: IProgressInfo) => {
    out.emit("progress", e);
  };

  const destPath = pathmaker.appPath(cave);

  let upload: IUploadRecord = null;
  let archivePath: string = null;

  if (cave.uploadId && cave.uploads && cave.uploads[cave.uploadId]) {
    upload = cave.uploads[cave.uploadId];
    archivePath = pathmaker.downloadPath(upload);
    log(opts, `Uninstalling app in ${destPath} from archive ${archivePath}`);
  } else {
    log(opts, `Uninstalling app in ${destPath}, no archive available`);
  }

  const coreOpts = {
    ...opts,
    onProgress,
    upload,
    archivePath,
    destPath,
  };
  globalMarket.saveEntity("caves", cave.id, {launchable: false, dead: true});

  try {
    await core.uninstall(out, coreOpts);
    log(opts, "Uninstallation successful");
  } catch (e) {
    if (e instanceof core.UnhandledFormat) {
      log(opts, e.message);
      log(opts, "Imploding anyway");
      await sf.wipe(destPath);
    } else {
      // re-raise other errors
      throw e;
    }
  }

  if (archivePath && !keepArchives) {
    log(opts, `Erasing archive ${archivePath}`);
    await sf.wipe(archivePath);
  }

  log(opts, `Imploding cave ${destPath}`);
  await globalMarket.deleteEntity("caves", cave.id, {wait: true});
}
