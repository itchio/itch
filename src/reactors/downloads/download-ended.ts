import { Watcher } from "../watcher";
import * as actions from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "download-ended" });

import { omit } from "underscore";

import downloadReasonToInstallReason from "./download-reason-to-install-reason";

const ITCH_INCREMENTAL_ONLY = process.env.ITCH_INCREMENTAL_ONLY === "1";

export default function(watcher: Watcher) {
  watcher.on(actions.downloadEnded, async (store, action) => {
    if (!!true) {
      // FIXME: just burn this reactor to the ground instead
      return;
    }

    const { item } = action.payload;
    let { err } = action.payload;

    const { reason, incremental } = item;
    if (err) {
      if (incremental) {
        logger.warn("Incremental didn't work, doing full download");
        if (ITCH_INCREMENTAL_ONLY) {
          store.dispatch(
            actions.statusMessage({
              message: "Incremental update failed, see console for details",
            })
          );
          return;
        }

        // FIXME: that's pretty bad tbh, maybe the main download logic
        // should just handle it?
        const newDownloadOpts = {
          ...omit(item, "upgradePath", "incremental"),
          totalSize: item.upload.size,
        };
        store.dispatch(actions.queueDownload(newDownloadOpts));
      } else {
        logger.error("Download had an error, should notify user");
      }
      return;
    }

    if (incremental) {
      // install folder was patched directly, no further steps needed
      return;
    }

    const installReason = downloadReasonToInstallReason(item.reason);
    if (installReason) {
      logger.info(`Download finished, starting ${reason}..`);
      store.dispatch(
        actions.queueInstall({
          archivePath: action.payload.result.archivePath,
          caveId: item.caveId,
          game: item.game,
          handPicked: item.handPicked,
          installLocation: item.installLocation,
          reason: installReason,
          upload: item.upload,
        })
      );
    }
  });
}
