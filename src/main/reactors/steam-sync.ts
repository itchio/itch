import { Conversation } from "@itchio/butlerd";
import { actions } from "common/actions";
import { asRequestError } from "common/butlerd/errors";
import * as messages from "common/butlerd/messages";
import { hookLogging } from "common/butlerd/utils";
import { isCancelled, LocalizedString, Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";

const logger = mainLogger.child(__filename);

// Conversations aren't serializable so they can't live in Redux. Only one
// login runs at a time (butlerd refuses a second), but it is keyed by id so
// a stale cancel can't hit a newer login.
const activeLogins = new Map<string, Conversation>();

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isCode(e: unknown, code: messages.Code): boolean {
  const re = asRequestError(e);
  return !!re && re.rpcError.code === code;
}

async function fetchStatus(store: Store) {
  const status = await mcall(messages.PublishSteamSyncGetStatus, {});
  store.dispatch(actions.steamSyncStatus({ status }));
  return status;
}

function onboarded(status: messages.PublishSteamSyncGetStatusResult) {
  return status.loggedIn && status.hasPublisherKey;
}

function openApps(store: Store) {
  store.dispatch(
    actions.openModal(
      modals.steamSyncApps.make({
        wind: "root",
        title: ["steam_sync.apps.title"],
        message: "",
        widgetParams: {},
      })
    )
  );
}

export default function (watcher: Watcher) {
  watcher.on(actions.steamSyncOpen, async (store) => {
    const status = await fetchStatus(store);
    if (onboarded(status)) {
      openApps(store);
      return;
    }
    store.dispatch(
      actions.openModal(
        modals.steamSyncOnboarding.make({
          wind: "root",
          title: ["steam_sync.onboarding.title"],
          message: "",
          widgetParams: {},
        })
      )
    );
  });

  watcher.on(actions.steamSyncOpenApps, async (store) => {
    openApps(store);
  });

  watcher.on(actions.steamSyncFetchStatus, async (store) => {
    await fetchStatus(store);
  });

  watcher.on(actions.steamSyncStartLogin, async (store, action) => {
    const { id } = action.payload;
    try {
      await mcall(messages.PublishSteamSyncLogin, { id }, (convo) => {
        hookLogging(convo, logger);
        activeLogins.set(id, convo);
        convo.onNotification(
          messages.PublishSteamSyncLoginChallenge,
          async ({ url }) => {
            store.dispatch(actions.steamSyncLoginChallenge({ id, url }));
          }
        );
      });
      store.dispatch(actions.steamSyncLoginDone({ id }));
      await fetchStatus(store);
    } catch (e) {
      if (isCancelled(e)) {
        store.dispatch(actions.steamSyncCancelLogin({ id }));
        return;
      }
      let message: LocalizedString;
      if (isCode(e, messages.Code.PublishSteamSyncLoginDenied)) {
        message = ["steam_sync.login.denied"];
      } else {
        logger.warn(`steam login failed: ${errorMessage(e)}`);
        message = ["steam_sync.login.failed", { message: errorMessage(e) }];
      }
      store.dispatch(actions.steamSyncLoginFailed({ id, message }));
    } finally {
      activeLogins.delete(id);
    }
  });

  watcher.on(actions.steamSyncCancelLogin, async (store, action) => {
    const convo = activeLogins.get(action.payload.id);
    if (convo) {
      convo.cancel();
    }
  });

  watcher.on(actions.steamSyncSetPublisherKey, async (store, action) => {
    const { key } = action.payload;
    try {
      const res = await mcall(messages.PublishSteamSyncSetPublisherKey, {
        key,
      });
      store.dispatch(actions.steamSyncKeySaved({ appCount: res.appCount }));
      await fetchStatus(store);
    } catch (e) {
      let message: LocalizedString;
      if (isCode(e, messages.Code.PublishSteamSyncPublisherKeyInvalid)) {
        message = ["steam_sync.key.invalid"];
      } else {
        logger.warn(`steam key rejected: ${errorMessage(e)}`);
        message = ["steam_sync.key.failed", { message: errorMessage(e) }];
      }
      store.dispatch(actions.steamSyncKeyFailed({ message }));
    }
  });

  watcher.on(actions.steamSyncDisconnect, async (store) => {
    await mcall(messages.PublishSteamSyncLogout, {});
    await fetchStatus(store);
  });

  watcher.on(actions.steamSyncFetchApps, async (store) => {
    try {
      const res = await mcall(messages.PublishSteamSyncListApps, {});
      store.dispatch(
        actions.steamSyncApps({
          apps: res.apps.map((a) => ({ id: a.id, name: a.name, type: a.type })),
        })
      );
    } catch (e) {
      let message: LocalizedString;
      if (isCode(e, messages.Code.PublishSteamSyncNotLoggedIn)) {
        message = ["steam_sync.error.not_logged_in"];
      } else {
        message = ["steam_sync.apps.failed", { message: errorMessage(e) }];
      }
      store.dispatch(actions.steamSyncAppsFailed({ message }));
      // the key or login may be gone; let the UI fall back to onboarding
      await fetchStatus(store);
    }
  });
}
