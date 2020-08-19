import { actions } from "common/actions";
import { getDownloadError } from "common/format/errors";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { join } from "path";
import * as sf from "main/os/sf";
import { showInstallErrorModal } from "main/reactors/tasks/show-install-error-modal";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
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

    await showInstallErrorModal({
      store,
      e: getDownloadError(item),
      log,
      game: item.game,
      retryAction: () => actions.retryDownload({ id }),
      stopAction: () => actions.discardDownload({ id }),
    });
  });
}
