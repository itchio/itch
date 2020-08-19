import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";
import { mainLogger } from "main/logger";
import { mcall } from "main/butlerd/mcall";
import { messages, hookLogging } from "common/butlerd";
import { legacyMarketPath } from "common/util/paths";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.setupDone, async (store, action) => {
    store.dispatch(actions.silentlyScanInstallLocations({}));
  });

  watcher.on(actions.silentlyScanInstallLocations, async (store, action) => {
    try {
      logger.info(`Scanning install locations for items...`);
      await mcall(
        messages.InstallLocationsScan,
        {
          legacyMarketPath: legacyMarketPath(),
        },
        (convo) => {
          hookLogging(convo, logger);
          convo.onNotification(messages.Progress, async ({ progress }) => {
            store.dispatch(actions.locationScanProgress({ progress }));
          });
          convo.onNotification(
            messages.InstallLocationsScanYield,
            async ({ game }) => {
              logger.info(`Found ${game.title} - ${game.url}`);
            }
          );
          convo.onRequest(
            messages.InstallLocationsScanConfirmImport,
            async ({ numItems }) => {
              logger.info(`In total, found ${numItems} items.`);
              return { confirm: true };
            }
          );
        }
      );
      logger.info(`Scan complete.`);
      store.dispatch(actions.newItemsImported({}));
    } finally {
      store.dispatch(actions.locationScanDone({}));
    }
  });
}
