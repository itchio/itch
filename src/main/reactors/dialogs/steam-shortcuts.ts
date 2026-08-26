import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import { SteamShortcutsParams } from "common/modals/types";
import { LocalizedString, Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";
import { applyShortcuts, getSnapshot, SteamError } from "main/steam/shortcuts";
import { isSteamRunning } from "main/steam/steam-install";

const logger = mainLogger.child(__filename);

let openModalId: string | null = null;
let openGeneration = 0;
let saveInProgress = false;
let saveProgress: SteamShortcutsParams["saveProgress"] = null;

function steamErrorMessage(e: unknown): LocalizedString {
  if (e instanceof SteamError) {
    switch (e.code) {
      case "no-steam":
        return ["steam.error.not_found"];
      case "no-user":
        return ["steam.error.no_user"];
      case "no-launcher":
        return ["steam.error.no_launcher"];
      case "steam-running":
        return ["steam.error.running"];
    }
  }
  return ["steam.error.generic", { message: String(e) }];
}

function dialogParams(
  store: Store,
  modalId: string
): SteamShortcutsParams | null {
  const wind = store.getState().winds["root"];
  if (!wind) {
    return null;
  }
  const modal = wind.modals.find((m) => m.id === modalId);
  return modal ? (modal.widgetParams as SteamShortcutsParams) : null;
}

function currentDialogParams(store: Store): SteamShortcutsParams | null {
  if (!openModalId) {
    return null;
  }
  const modal = dialogParams(store, openModalId);
  if (!modal) {
    // the dialog was closed
    openModalId = null;
    return null;
  }
  return modal;
}

function updateSaveState(store: Store) {
  const modalId = openModalId;
  if (!modalId) {
    return;
  }
  const current = dialogParams(store, modalId);
  if (!current) {
    return;
  }
  store.dispatch(
    actions.updateModalWidgetParams(
      modals.steamShortcuts.update({
        id: modalId,
        widgetParams: {
          ...current,
          saving: saveInProgress,
          saveProgress,
        },
      })
    )
  );
}

async function fetchInstalledGames(): Promise<Game[]> {
  const { items } = await mcall(messages.FetchCaves, {});
  const byId = new Map<number, Game>();
  for (const cave of items ?? []) {
    if (cave.game) {
      byId.set(cave.game.id, cave.game);
    }
  }
  return [...byId.values()];
}

// tolerates a butlerd outage by reusing the open dialog's last known
// library; the rows would otherwise collapse to "nothing installed",
// staging removals of games that are actually installed
async function fetchInstalledGamesWithFallback(
  store: Store,
  fallback?: Game[]
): Promise<Game[]> {
  try {
    return await fetchInstalledGames();
  } catch (e) {
    const installedGames =
      fallback ?? currentDialogParams(store)?.installedGames;
    if (installedGames) {
      logger.warn(`could not fetch installed games, reusing last list: ${e}`);
      return installedGames;
    }
    throw e;
  }
}

async function refreshDialog(
  store: Store,
  lastOpError: LocalizedString | null
) {
  const modalId = openModalId;
  if (!modalId) {
    return;
  }
  const previous = dialogParams(store, modalId);
  if (!previous) {
    return;
  }
  const snapshot = await getSnapshot();
  snapshot.lastOpError = lastOpError;
  const installedGames = await fetchInstalledGamesWithFallback(
    store,
    previous.installedGames
  );
  if (openModalId !== modalId || !dialogParams(store, modalId)) {
    return;
  }
  store.dispatch(
    actions.updateModalWidgetParams(
      modals.steamShortcuts.update({
        id: modalId,
        widgetParams: {
          snapshot,
          installedGames,
          saving: saveInProgress,
          saveProgress,
        },
      })
    )
  );
}

// Save is disabled in the dialog while Steam runs; poll so quitting
// Steam un-disables it without a refresh button. Scoped to the dialog's
// lifetime: processes() enumerates every process on the system.
let pollTimer: NodeJS.Timeout | null = null;
let polling = false;

function stopSteamPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startSteamPoll(store: Store) {
  stopSteamPoll();
  pollTimer = setInterval(async () => {
    if (polling) {
      return;
    }
    const params = currentDialogParams(store);
    if (!params) {
      stopSteamPoll();
      return;
    }
    polling = true;
    try {
      const running = await isSteamRunning();
      const current = currentDialogParams(store);
      if (current && current.snapshot.steamRunning !== running) {
        if (current.snapshot.steamRunning && !running) {
          // Steam writes its in-memory shortcut state while exiting.
          // Reload the file before enabling Save against that new state.
          await refreshDialog(store, null);
          return;
        }
        store.dispatch(
          actions.updateModalWidgetParams(
            modals.steamShortcuts.update({
              id: openModalId!,
              widgetParams: {
                ...current,
                snapshot: { ...current.snapshot, steamRunning: running },
              },
            })
          )
        );
      }
    } catch (e) {
      // next interval retries
    } finally {
      polling = false;
    }
  }, 5000);
}

export default function (watcher: Watcher) {
  watcher.on(actions.openSteamShortcutsDialog, async (store, action) => {
    const { gameId } = action.payload;
    const generation = ++openGeneration;

    if (currentDialogParams(store)) {
      // a second dialog would orphan the first from updates
      store.dispatch(actions.closeModal({ wind: "root", id: openModalId! }));
      openModalId = null;
      stopSteamPoll();
    }

    const snapshot = await getSnapshot();
    let installedGames: Game[] = [];
    try {
      installedGames = await fetchInstalledGames();
    } catch (e) {
      logger.warn(`could not fetch installed games: ${e}`);
    }
    if (generation !== openGeneration) {
      return;
    }

    const modal = modals.steamShortcuts.make({
      wind: "root",
      title: ["steam.dialog.title"],
      message: "",
      widgetParams: {
        snapshot,
        installedGames,
        initialGameId: gameId,
        saving: saveInProgress,
        saveProgress,
      },
    });
    openModalId = modal.id;
    store.dispatch(actions.openModal(modal));
    startSteamPoll(store);
  });

  watcher.on(actions.steamShortcutsSave, async (store, action) => {
    if (saveInProgress || !currentDialogParams(store)) {
      return;
    }
    saveInProgress = true;
    saveProgress = null;
    updateSaveState(store);

    const { ensureGameIds, repairGameIds, removeGameIds } = action.payload;
    let error: LocalizedString | null = null;
    try {
      const ensureSet = new Set(ensureGameIds);
      const installed =
        ensureSet.size > 0 ? await fetchInstalledGamesWithFallback(store) : [];
      const ensure = installed.filter((g) => ensureSet.has(g.id));
      if (ensure.length > 0) {
        saveProgress = { completed: 0, total: ensure.length };
        updateSaveState(store);
      }
      await applyShortcuts({
        ensure,
        repairGameIds,
        removeGameIds,
        onProgress: (completed, total) => {
          saveProgress = { completed, total };
          updateSaveState(store);
        },
      });
    } catch (e) {
      logger.warn(`could not apply Steam shortcuts: ${e}`);
      error = steamErrorMessage(e);
    }
    saveInProgress = false;
    saveProgress = null;
    await refreshDialog(store, error);
  });
}
