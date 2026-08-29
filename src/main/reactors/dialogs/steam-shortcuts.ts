import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import { SteamShortcutsParams } from "common/modals/types";
import { LocalizedString, Store } from "common/types";
import { SteamDirectTarget } from "common/types/steam";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import modals from "main/modals";
import {
  applyShortcuts,
  encodeSteamArguments,
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

// caves from the latest successful FetchCaves, for resolving direct launch
// targets; survives a butlerd outage alongside the games fallback
let lastCavesByGame = new Map<number, messages.Cave[]>();

// when a game has several caves installed, direct shortcuts follow the
// one the user actually plays: last touched, then most recently
// installed. Retargeting after they switch installs surfaces as a
// "Will update" in the dialog.
function cavePreference(cave: messages.Cave): number {
  const at =
    cave.stats.localLastRunAt ??
    cave.stats.lastTouchedAt ??
    cave.stats.installedAt;
  const ms = at ? new Date(at).getTime() : 0;
  return isNaN(ms) ? 0 : ms;
}

async function fetchInstalledGames(): Promise<Game[]> {
  const { items } = await mcall(messages.FetchCaves, {});
  const byId = new Map<number, Game>();
  const cavesByGame = new Map<number, messages.Cave[]>();
  for (const cave of items ?? []) {
    if (!cave.game) {
      continue;
    }
    const caves = cavesByGame.get(cave.game.id) ?? [];
    caves.push(cave);
    cavesByGame.set(cave.game.id, caves);
  }
  for (const [gameId, caves] of cavesByGame) {
    caves.sort((a, b) => cavePreference(b) - cavePreference(a));
    byId.set(gameId, caves[0].game);
  }
  lastCavesByGame = cavesByGame;
  return [...byId.values()];
}

const directFlavors: { [platform: string]: messages.Flavor[] } = {
  linux: [messages.Flavor.NativeLinux],
  win32: [messages.Flavor.NativeWindows],
  darwin: [messages.Flavor.NativeMacos, messages.Flavor.AppMacos],
};

// the command a "direct" shortcut would use: the first launch target
// that is a native binary for this platform. html/jar/script targets
// can't be launched by Steam without a wrapper.
async function resolveDirectTarget(
  caveId: string
): Promise<SteamDirectTarget | null> {
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
      return {
        path: strategy.fullTargetPath,
        launchOptions: encodeSteamArguments(target.action.args ?? []),
      };
    }
  }
  return null;
}

// Prefer the cave with the most recent play/install activity, but do not let
// a browser game or bonus-content cave mask an older native installation.
async function resolveDirectTargetForGame(
  gameId: number
): Promise<SteamDirectTarget | null> {
  for (const cave of lastCavesByGame.get(gameId) ?? []) {
    const target = await resolveDirectTarget(cave.id);
    if (target) {
      return target;
    }
  }
  return null;
}

async function forEachWithConcurrency<T>(
  items: T[],
  concurrency: number,
  work: (item: T) => Promise<void>
) {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await work(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
}

// Target discovery can refresh upload metadata, so cap concurrent calls.
// It still runs after the dialog opens and pushes all results in when done.
let targetsGeneration = 0;

async function refreshDirectTargets(store: Store) {
  const modalId = openModalId;
  if (!modalId) {
    return;
  }
  const generation = ++targetsGeneration;
  const results: NonNullable<SteamShortcutsParams["directTargets"]> = {};
  await forEachWithConcurrency(
    [...lastCavesByGame.keys()],
    6,
    async (gameId) => {
      try {
        results[gameId] = await resolveDirectTargetForGame(gameId);
      } catch (e) {
        results[gameId] = null;
      }
    }
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
          let target: SteamDirectTarget | null = null;
          if (lastCavesByGame.has(game.id)) {
            try {
              target = await resolveDirectTargetForGame(game.id);
            } catch (e) {
              logger.warn(`could not resolve target for ${game.title}: ${e}`);
            }
          }
          if (!target) {
            target =
              currentDialogParams(store)?.directTargets?.[game.id] ?? null;
          }
          if (!target) {
            throw new SteamError("no-target");
          }
          ensure.push({ game, mode, target });
        } else {
          // bake the active profile in so play sessions attribute to
          // the account that created the shortcut
          ensure.push({
            game,
            mode,
            profileId: store.getState().profile.profile?.id,
          });
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
