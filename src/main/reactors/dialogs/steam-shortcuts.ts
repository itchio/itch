import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import { SteamShortcutsParams } from "common/modals/types";
import { LocalizedString, Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";
import {
  applyShortcuts,
  EnsureShortcut,
  getSnapshot,
  SteamError,
} from "main/steam/shortcuts";
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
      case "no-target":
        return ["steam.error.no_target"];
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

// cave ids from the latest successful FetchCaves, for resolving direct
// launch targets; survives a butlerd outage alongside the games fallback
let lastCaveIds = new Map<number, string>();

async function fetchInstalledGames(): Promise<Game[]> {
  const { items } = await mcall(messages.FetchCaves, {});
  const byId = new Map<number, Game>();
  const caveIds = new Map<number, string>();
  for (const cave of items ?? []) {
    if (cave.game && !byId.has(cave.game.id)) {
      byId.set(cave.game.id, cave.game);
      caveIds.set(cave.game.id, cave.id);
    }
  }
  lastCaveIds = caveIds;
  return [...byId.values()];
}

const directFlavors: { [platform: string]: messages.Flavor[] } = {
  linux: [messages.Flavor.NativeLinux],
  win32: [messages.Flavor.NativeWindows],
  darwin: [messages.Flavor.NativeMacos, messages.Flavor.AppMacos],
};

// the executable a "direct" shortcut would point at: the first launch
// target that is a native binary for this platform. html/jar/script
// targets can't be launched by Steam without a wrapper.
async function resolveDirectTarget(caveId: string): Promise<string | null> {
  const { targets } = await mcall(messages.LaunchGetTargets, { caveId });
  const flavors = directFlavors[process.platform] ?? [];
  for (const target of targets ?? []) {
    const { strategy } = target;
    if (
      strategy?.strategy === messages.LaunchStrategy.Native &&
      strategy.fullTargetPath &&
      strategy.candidate &&
      flavors.includes(strategy.candidate.flavor)
    ) {
      return strategy.fullTargetPath;
    }
  }
  return null;
}

// resolution fans out one butlerd call per installed game, so it runs
// after the dialog is already up and pushes results in when done
let targetsGeneration = 0;

async function refreshDirectTargets(store: Store) {
  const modalId = openModalId;
  if (!modalId) {
    return;
  }
  const generation = ++targetsGeneration;
  const results: { [gameId: number]: string | null } = {};
  await Promise.all(
    [...lastCaveIds].map(async ([gameId, caveId]) => {
      try {
        results[gameId] = await resolveDirectTarget(caveId);
      } catch (e) {
        results[gameId] = null;
      }
    })
  );
  if (generation !== targetsGeneration || openModalId !== modalId) {
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
        widgetParams: { ...current, directTargets: results },
      })
    )
  );
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
          directTargets: previous.directTargets,
        },
      })
    )
  );
  refreshDirectTargets(store).catch((e) => {
    logger.warn(`could not refresh direct launch targets: ${e}`);
  });
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
        directTargets: null,
      },
    });
    openModalId = modal.id;
    store.dispatch(actions.openModal(modal));
    startSteamPoll(store);
    refreshDirectTargets(store).catch((e) => {
      logger.warn(`could not resolve direct launch targets: ${e}`);
    });
  });

  watcher.on(actions.steamShortcutsSave, async (store, action) => {
    if (saveInProgress || !currentDialogParams(store)) {
      return;
    }
    saveInProgress = true;
    saveProgress = null;
    updateSaveState(store);

    const {
      ensure: ensureItems,
      repairGameIds,
      removeGameIds,
    } = action.payload;
    let error: LocalizedString | null = null;
    try {
      const modeById = new Map(ensureItems.map((e) => [e.gameId, e.mode]));
      const installed =
        modeById.size > 0 ? await fetchInstalledGamesWithFallback(store) : [];
      const ensure: EnsureShortcut[] = [];
      for (const game of installed) {
        const mode = modeById.get(game.id);
        if (!mode) {
          continue;
        }
        if (mode === "direct") {
          // re-resolve at save time: the target can move when the game
          // updates between staging and saving
          let targetPath: string | null = null;
          const caveId = lastCaveIds.get(game.id);
          if (caveId) {
            try {
              targetPath = await resolveDirectTarget(caveId);
            } catch (e) {
              logger.warn(`could not resolve target for ${game.title}: ${e}`);
            }
          }
          if (!targetPath) {
            targetPath =
              currentDialogParams(store)?.directTargets?.[game.id] ?? null;
          }
          if (!targetPath) {
            throw new SteamError("no-target");
          }
          ensure.push({ game, mode, targetPath });
        } else {
          ensure.push({ game, mode });
        }
      }
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
