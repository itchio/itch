import { Watcher } from "./watcher";

import * as clone from "clone";

import { BrowserWindow, Menu } from "electron";

import localizer from "../localizer";

import { IStore } from "../types";

import { pathToId } from "../util/navigation";

import actionForGame from "../util/action-for-game";

import * as actions from "../actions";

import db from "../db";

const emptyArr = [];

type IMenuItem = Electron.MenuItemConstructorOptions;

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "context-menu" });

function openMenu(store: IStore, template: IMenuItem[]) {
  if (template.length === 0) {
    // showing empty context menus would be NSANE!
    return;
  }

  const menu = Menu.buildFromTemplate(clone(template));
  const mainWindowId = store.getState().ui.mainWindow.id;
  const mainWindow = BrowserWindow.fromId(mainWindowId);
  menu.popup(mainWindow, { async: true, y: undefined });
}

export default function(watcher: Watcher) {
  watcher.on(actions.openTabContextMenu, async (store, action) => {
    const { id } = action.payload;

    const data = store.getState().session.tabData[id];
    if (!data) {
      logger.warn(`Can't make context menu for non-transient tab ${id}`);
      return;
    }

    const { path } = data;

    const template: IMenuItem[] = [];
    if (/^games/.test(path)) {
      const gameId = pathToId(path);
      const games = data.games || {};
      const game = games[gameId];
      store.dispatch(actions.openGameContextMenu({ game }));
    }

    openMenu(store, template);
  });

  watcher.on(actions.openGameContextMenu, async (store, action) => {
    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);

    const { game } = action.payload;
    const gameId = game.id;
    const cave = await db.caves.findOne({ gameId });
    const mainAction = actionForGame(game, cave);

    const template: IMenuItem[] = [];
    if (cave) {
      let busy = false;

      const state = store.getState();
      const tasksForGame = state.tasks.tasksByGameId[gameId];
      if (tasksForGame && tasksForGame.length > 0) {
        busy = true;
      }

      template.push({
        label: t(`grid.item.${mainAction}`),
        click: () => store.dispatch(actions.queueGame({ game })),
      });
      if (!busy) {
        template.push({
          label: t("grid.item.check_for_update"),
          click: () =>
            store.dispatch(
              actions.checkForGameUpdate({ caveId: cave.id, noisy: true }),
            ),
        });
      }
      template.push({
        label: t("grid.item.show_local_files"),
        click: () => store.dispatch(actions.exploreCave({ caveId: cave.id })),
      });

      template.push({ type: "separator" });

      let advancedItems: IMenuItem[] = [
        {
          label: t("grid.item.open_debug_log"),
          click: () => store.dispatch(actions.probeCave({ caveId: cave.id })),
        },
      ];

      if (cave && cave.buildId) {
        advancedItems = [
          ...advancedItems,
          {
            type: "separator",
          },
          {
            label: t("grid.item.verify_integrity"),
            click: () => store.dispatch(actions.healCave({ caveId: cave.id })),
          },
          {
            label: t("grid.item.revert_to_version"),
            click: () =>
              store.dispatch(actions.revertCaveRequest({ caveId: cave.id })),
          },
          {
            type: "separator",
          },
        ];
      }

      advancedItems = [
        ...advancedItems,
        {
          label: t("grid.item.view_details"),
          click: () =>
            store.dispatch(actions.viewCaveDetails({ caveId: cave.id })),
        },
      ];

      template.push({
        label: t("grid.item.advanced"),
        submenu: advancedItems,
      });

      if (!busy) {
        template.push({ type: "separator" });

        template.push({
          label: t("prompt.uninstall.reinstall"),
          click: () =>
            store.dispatch(actions.queueCaveReinstall({ caveId: cave.id })),
        });
        template.push({
          label: t("prompt.uninstall.uninstall"),
          click: () =>
            store.dispatch(actions.queueCaveUninstall({ caveId: cave.id })),
        });
      }
    } else {
      const downloadKeys =
        store.getState().commons.downloadKeyIdsByGameId[game.id] || emptyArr;
      const owned = downloadKeys.length > 0;

      const hasMinPrice = game.minPrice > 0;
      const free = !hasMinPrice;

      const meId = store.getState().session.credentials.me.id;
      const canEdit = game.userId === meId;
      const mayDownload = !!(
        downloadKeys.length > 0 ||
        !hasMinPrice ||
        canEdit
      );

      if (mayDownload) {
        template.push({
          label: t("grid.item.install"),
          click: () => store.dispatch(actions.queueGame({ game })),
        });
      } else {
        // TODO: use canBeBought
        template.push({
          label: t("grid.item.buy_now"),
          click: () => store.dispatch(actions.initiatePurchase({ game })),
        });
      }
    }

    openMenu(store, template);
  });
}
