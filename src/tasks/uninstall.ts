
import {EventEmitter} from "events";

import * as paths from "../os/paths";

import * as sf from "../os/sf";
import rootLogger from "../logger";
const logger = rootLogger.child({name: "uninstall"});

import core from "./install/core";

import store from "../store/metal-store";

const keepArchives = (process.env.REMEMBER_ME_WHEN_IM_GONE === "1");

import {IStartTaskOpts, IUploadRecord} from "../types";
import {IProgressInfo} from "../types";

export default async function start (out: EventEmitter, opts: IStartTaskOpts) {
  const {cave} = opts;
  // FIXME: db
  const globalMarket: any = null;

  const onProgress = (e: IProgressInfo) => {
    out.emit("progress", e);
  };

  const {preferences} = store.getState();
  const destPath = paths.appPath(cave, preferences);

  let upload: IUploadRecord = null;
  let archivePath: string = null;

  if (cave.uploadId && cave.uploads && cave.uploads[cave.uploadId]) {
    upload = cave.uploads[cave.uploadId];
    archivePath = paths.downloadPath(upload, preferences);
    logger.info(`Uninstalling app in ${destPath} from archive ${archivePath}`);
  } else {
    logger.info(`Uninstalling app in ${destPath}, no archive available`);
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
    logger.info("Uninstallation successful");
  } catch (e) {
    if (e instanceof core.UnhandledFormat) {
      logger.warn(e.message);
      logger.info("Imploding anyway");
      await sf.wipe(destPath);
    } else {
      // re-raise other errors
      throw e;
    }
  }

  if (archivePath && !keepArchives) {
    logger.info(`Erasing archive ${archivePath}`);
    await sf.wipe(archivePath);
  }

  logger.info(`Imploding cave ${destPath}`);
  await globalMarket.deleteEntity("caves", cave.id, {wait: true});
}
