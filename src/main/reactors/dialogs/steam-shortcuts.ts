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

function currentDialogParams(store: Store): SteamShortcutsParams | null {
  if (!openModalId) {
    return null;
  }
  const { modals } = store.getState().winds["root"];
  const modal = modals.find((m) => m.id === openModalId);
  return modal ? (modal.widgetParams as SteamShortcutsParams) : null;
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

async function refreshDialog(
  store: Store,
  lastOpError: LocalizedString | null
) {
  if (!currentDialogParams(store)) {
    return;
  }
  const snapshot = await getSnapshot();
  snapshot.lastOpError = lastOpError;
  let installedGames: Game[] = [];
  try {
    installedGames = await fetchInstalledGames();
  } catch (e) {
    logger.warn(`could not fetch installed games: ${e}`);
  }
  store.dispatch(
    actions.updateModalWidgetParams(
      modals.steamShortcuts.update({
        id: openModalId!,
        widgetParams: { snapshot, installedGames },
      })
    )
  );
}

export default function (watcher: Watcher) {
  watcher.on(actions.openSteamShortcutsDialog, async (store, action) => {
    const { gameId } = action.payload;

    const snapshot = await getSnapshot();
    let installedGames: Game[] = [];
    try {
      installedGames = await fetchInstalledGames();
    } catch (e) {
      logger.warn(`could not fetch installed games: ${e}`);
    }

    const modal = modals.steamShortcuts.make({
      wind: "root",
      title: ["steam.dialog.title"],
      message: "",
      widgetParams: { snapshot, installedGames, initialGameId: gameId },
    });
    openModalId = modal.id;
    store.dispatch(actions.openModal(modal));
  });

  watcher.on(actions.steamShortcutsSave, async (store, action) => {
    const { checkedGameIds, uncheckedGameIds } = action.payload;
    let error: LocalizedString | null = null;
    try {
      const installed = await fetchInstalledGames();
      const checked = new Set(checkedGameIds);
      await applyShortcuts({
        ensure: installed.filter((g) => checked.has(g.id)),
        removeGameIds: uncheckedGameIds,
      });
    } catch (e) {
      logger.warn(`could not apply Steam shortcuts: ${e}`);
      error = steamErrorMessage(e);
    }
    await refreshDialog(store, error);
  });

  // Save is disabled in the dialog while Steam runs; keep that flag
  // fresh so quitting Steam un-disables it without a refresh button
  let checkingSteam = false;
  let tickCount = 0;
  watcher.on(actions.tick, async (store, action) => {
    tickCount++;
    if (tickCount % 5 !== 0 || checkingSteam) {
      return;
    }
    const params = currentDialogParams(store);
    if (!params) {
      return;
    }
    checkingSteam = true;
    try {
      const running = await isSteamRunning();
      const current = currentDialogParams(store);
      if (current && current.snapshot.steamRunning !== running) {
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
      // next tick retries
    } finally {
      checkingSteam = false;
    }
  });
}
