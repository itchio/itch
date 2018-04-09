import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";
import * as sf from "../../os/sf";

import rootLogger from "common/logger";
import { join } from "path";
import { getDownloadError } from "common/format/errors";
import { makeInstallErrorModal } from "../tasks/make-install-error-modal";
const logger = rootLogger.child({ name: "show-download-error" });

export default function(watcher: Watcher) {
  watcher.on(actions.showDownloadError, async (store, action) => {
    const { id } = action.payload;

    const { downloads } = store.getState();
    const item = downloads.items[id];
    if (!item) {
      logger.warn(
        `can't show download error for item we don't know about! (${id})`
      );
      return;
    }

    const operateLogPath = join(item.stagingFolder, "operate-log.json");
    let log = "<missing log>";
    try {
      log = await sf.readFile(operateLogPath, { encoding: "utf8" });
    } catch (e) {
      logger.warn(`could not read log: ${e.stack}`);
    }

    store.dispatch(
      actions.openModal(
        makeInstallErrorModal({
          store,
          e: getDownloadError(item),
          log,
          game: item.game,
          retryAction: () => actions.retryDownload({ id }),
          stopAction: () => actions.discardDownload({ id }),
        })
      )
    );
  });
}
