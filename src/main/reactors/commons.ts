import { getErrorStack } from "common/butlerd/errors";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import groupIdBy from "common/helpers/group-id-by";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { indexBy, isEmpty, isEqual, throttle } from "underscore";

const logger = mainLogger.child(__filename);

async function updateCommonsNow(store: Store) {
  try {
    await updateCommonsNowThrows(store);
  } catch (e) {
    logger.warn(`While fetching commons: ${getErrorStack(e)}`);
  }
}

async function updateCommonsNowThrows(store: Store) {
  if (!store.getState().setup.done) {
    return;
  }

  const { caves, downloadKeys, installLocations } = await mcall(
    messages.FetchCommons,
    { profileId: store.getState().profile.profile?.id }
  );

  let locationSizes: { [key: string]: number } = {};
  if (!isEmpty(installLocations)) {
    for (const x of installLocations) {
      if (x.sizeInfo) {
        locationSizes[x.id] = x.sizeInfo.installedSize;
      }
    }
  }

  push(store, {
    caves: indexBy(caves, "id"),
    caveIdsByGameId: groupIdBy(caves, "gameId"),
    downloadKeys: indexBy(downloadKeys, "id"),
    downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
    locationSizes,
  });

  void hydrateInteractions(store);
}

const updateCommons = throttle(updateCommonsNow, 500);

// Across sessions "already hydrated" is the butler-side interaction row
// itself, including confirmed-zero rows. Failures stay eligible behind a
// cooldown so an offline session recovers on a later commons refresh
// instead of hammering every tick.
const hydratedThisSession = new Set<string>();
let hydrating = false;
let hydrationCooldownUntil = 0;
const hydrationCooldownMs = 10 * 60 * 1000;

// Transition shim for the play time migration (butler 15.30: per-profile
// user_game_interactions replacing unscoped cave columns). Butler starts with
// an empty interaction table, so games played before the migration would show
// "never played" until launched or visited; this hydrates those rows from the
// server. Removable once libraries predating the migration are no longer a
// concern: it goes quiet after one pass, since launches and game-page visits
// keep rows hydrated on their own.
async function hydrateInteractions(store: Store) {
  if (hydrating || Date.now() < hydrationCooldownUntil) {
    return;
  }
  const profileId = store.getState().profile.profile?.id;
  if (!profileId) {
    return;
  }

  const { caves } = store.getState().commons;
  const gameIds = new Set<number>();
  for (const caveId of Object.keys(caves)) {
    const cave = caves[caveId];
    if (cave.interaction) {
      continue;
    }
    if (cave.secondsRun <= 0 && (cave.localSecondsRun ?? 0) <= 0) {
      continue;
    }
    if (hydratedThisSession.has(`${profileId}:${cave.gameId}`)) {
      continue;
    }
    gameIds.add(cave.gameId);
  }
  if (gameIds.size === 0) {
    return;
  }

  hydrating = true;
  try {
    logger.info(`hydrating play time for ${gameIds.size} game(s)...`);
    let hydrated = 0;
    let failed = 0;
    for (const gameId of gameIds) {
      try {
        await mcall(messages.FetchGameInteraction, {
          profileId,
          gameId,
          fresh: true,
        });
        hydratedThisSession.add(`${profileId}:${gameId}`);
        hydrated++;
      } catch (e) {
        failed++;
        logger.warn(
          `could not hydrate play time for game ${gameId}: ${getErrorStack(e)}`
        );
      }
    }
    if (failed > 0) {
      hydrationCooldownUntil = Date.now() + hydrationCooldownMs;
    }
    if (hydrated > 0) {
      updateCommons(store);
    }
  } finally {
    hydrating = false;
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.loggedOut, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.windFocusChanged, async (store, action) => {
    if (action.payload.focused) {
      updateCommons(store);
    }
  });

  watcher.on(actions.downloadEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.uninstallEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.launchEnded, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.newItemsImported, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.ownedKeysFetched, async (store, action) => {
    updateCommons(store);
  });

  watcher.on(actions.installLocationsChanged, async (store, action) => {
    updateCommons(store);
  });
}

function push(store: Store, next: typeof actions.commonsUpdated.payload) {
  const prev = store.getState().commons;

  let hasDifferences = false;
  for (const k of Object.keys(next)) {
    if (!isEqual((prev as any)[k], (next as any)[k])) {
      hasDifferences = true;
      break;
    }
  }

  if (hasDifferences) {
    store.dispatch(actions.commonsUpdated(next));
  }
}
