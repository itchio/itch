import { actions } from "common/actions";
import { partitionForUser } from "common/util/partition-for-user";
import { mainLogPath, preferencesPath } from "common/util/paths";
import { Watcher } from "common/util/watcher";
import { session, shell } from "electron";
import { mainLogger } from "main/logger";
import * as sf from "main/os/sf";

const logger = mainLogger.child(__filename);

let saveAtomicInvocations = 0;

export default function (watcher: Watcher) {
  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = store.getState().preferences;

    // write prefs atomically
    const file = preferencesPath();
    const tmpPath = file + ".tmp" + saveAtomicInvocations++;
    await sf.writeFile(tmpPath, JSON.stringify(prefs), { encoding: "utf8" });
    await sf.rename(tmpPath, file);
  });

  watcher.on(actions.clearBrowsingData, async (store, action) => {
    const promises: Promise<any>[] = [];

    const userId = store.getState().profile.profile.id;
    const partition = partitionForUser(String(userId));
    const ourSession = session.fromPartition(partition, { cache: true });

    logger.debug(`asked to clear browsing data`);

    if (action.payload.cache) {
      logger.debug(`clearing cache for ${partition}`);
      promises.push(ourSession.clearCache());
    }

    if (action.payload.cookies) {
      logger.debug(`clearing cookies for ${partition}`);
      promises.push(
        ourSession.clearStorageData({
          storages: ["cookies"],
          // for all origins
          origin: null,
          // look chromium just clear everything thanks
          quotas: ["temporary", "persistent", "syncable"],
        })
      );
    }

    await Promise.all(promises);

    store.dispatch(
      actions.statusMessage({
        message: ["prompt.clear_browsing_data.notification"],
      })
    );
  });

  watcher.on(actions.openAppLog, async (store, action) => {
    const path = mainLogPath();
    logger.info(`Opening app log at ${path}`);
    shell.showItemInFolder(path);
  });
}
