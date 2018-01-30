import { Watcher } from "../watcher";
import { actions } from "../../actions";
import * as paths from "../../os/paths";
import * as sf from "../../os/sf";

import { DB } from "../../db/index";

import rootLogger from "../../logger";
import { ICave } from "../../db/models/cave";
import { computeCaveLocation } from "./compute-cave-location";
import { join } from "path";
import { modalWidgets } from "../../components/modal-widgets/index";
const logger = rootLogger.child({ name: "show-download-error" });

export default function(watcher: Watcher, db: DB) {
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

    const { preferences } = store.getState();
    let caveIn: ICave;
    if (item.caveId) {
      caveIn = db.caves.findOneById(item.caveId);
    }

    const { caveLocation } = computeCaveLocation(item, preferences, caveIn);

    const stagingFolder = paths.downloadFolderPathForId(
      preferences,
      caveLocation.installLocation,
      item.id
    );

    const operateLogPath = join(stagingFolder, "operate-log.json");
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
            errorStack: item.errStack,
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
