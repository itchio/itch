import { getErrorStack } from "common/butlerd/errors";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { throttle } from "underscore";

const logger = mainLogger.child(__filename);

// Keeps the local index of games owned through bundles in sync, so
// Fetch.GameOwnership can answer without network I/O. The fresh sync walks
// every owned bundle's game list, so it only runs when butler reports the
// cached data as stale.
async function syncBundleOwnershipsNow(store: Store) {
  try {
    const { profile } = store.getState().profile;
    if (!profile) {
      return;
    }
    const profileId = profile.id;

    const res = await mcall(messages.FetchProfileBundleOwnerships, {
      profileId,
    });
    if (!res.stale) {
      return;
    }

    logger.info(`Bundle ownership stale, syncing...`);
    const freshRes = await mcall(messages.FetchProfileBundleOwnerships, {
      profileId,
      fresh: true,
    });
    logger.info(
      `Synced ${freshRes.syncedBundles}/${freshRes.totalBundles} owned bundles`
    );
  } catch (e) {
    logger.warn(`While syncing bundle ownerships: ${getErrorStack(e)}`);
  }
}

const syncBundleOwnerships = throttle(syncBundleOwnershipsNow, 60 * 1000);

export default function (watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    syncBundleOwnerships(store);
  });

  watcher.on(actions.windFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      syncBundleOwnerships(store);
    }
  });
}
