import { Watcher } from "../watcher";
import { actions } from "../../actions";
import * as sf from "../../os/sf";

import rootLogger from "../../logger";
import { join } from "path";
import { modalWidgets } from "../../components/modal-widgets/index";
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
        modalWidgets.showError.make({
          title: ["prompt.install_error.title"],
          message: ["prompt.install_error.message"],
          widgetParams: {
            rawError: { stack: item.error },
            log,
          },
          buttons: [
            {
              label: ["game.install.try_again"],
              icon: "repeat",
              action: actions.retryDownload({ id }),
            },
            {
              label: ["grid.item.discard_download"],
              icon: "delete",
              action: actions.discardDownload({ id }),
            },
            "cancel",
          ],
        })
      )
    );
  });
}
