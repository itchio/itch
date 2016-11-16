
import {Watcher} from "./watcher";

import * as clone from "clone";

import {BrowserWindow, Menu} from "../electron";
import localizer from "../localizer";

import {pathToId} from "../util/navigation";
import {getUserMarket} from "./market";

import actionForGame from "../util/action-for-game";

import * as actions from "../actions";

import {findWhere} from "underscore";

import mklog from "../util/log";
import {opts} from "../logger";
const log = mklog("reactors/context-menu");

export default function (watcher: Watcher) {
  watcher.on(actions.openTabContextMenu, async (store, action) => {
    const {id} = action.payload;

    const data = store.getState().session.navigation.tabData[id];
    if (!data) {
      log(opts, `Can't make context menu for non-transient tab ${id}`);
      return;
    }

    const {path} = data;
    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);

    const template = [] as any[];
    if (/^games/.test(path)) {
      const gameId = pathToId(path);
      const games = (data.games || {});
      const game = games[gameId];
      const cave = store.getState().globalMarket.cavesByGameId[gameId];
      const mainAction = actionForGame(game, cave);

      if (cave) {
        template.push({
          label: t(`grid.item.${mainAction}`),
          click: () => store.dispatch(actions.queueGame({game})),
        });
        template.push({
          label: t("grid.item.show_local_files"),
          click: () => store.dispatch(actions.exploreCave({caveId: cave.id})),
        });
        template.push({ type: "separator" });
        template.push({
          label: t("grid.item.developer"),
          submenu: [
            {
              label: t("grid.item.check_for_update"),
              click: () => store.dispatch(actions.checkForGameUpdate({caveId: cave.id, noisy: true})),
            },
            {
              label: t("grid.item.open_debug_log"),
              click: () => store.dispatch(actions.probeCave({caveId: cave.id})),
            },
          ],
        });
        template.push({ type: "separator" });
        template.push({
          label: t("prompt.uninstall.reinstall"),
          click: () => store.dispatch(actions.queueCaveReinstall({caveId: cave.id})),
        });
        template.push({
          label: t("prompt.uninstall.uninstall"),
          click: () => store.dispatch(actions.queueCaveUninstall({caveId: cave.id})),
        });
      } else {
        const downloadKeys = getUserMarket().getEntities("downloadKeys");
        const downloadKey = findWhere(downloadKeys, {gameId: game.id});
        const hasMinPrice = game.minPrice > 0;
        // FIXME game admins
        const meId = store.getState().session.credentials.me.id;
        const canEdit = game.userId === meId;
        const mayDownload = !!(downloadKey || !hasMinPrice || canEdit);

        if (mayDownload) {
          template.push({
            label: t("grid.item.install"),
            click: () => store.dispatch(actions.queueGame({game})),
          });
        } else {
          // TODO: use canBeBought
          template.push({
            label: t("grid.item.buy_now"),
            click: () => store.dispatch(actions.initiatePurchase({game})),
          });
        }
      }
    }

    if (template.length === 0) {
      // showing empty context menus would be NSANE!
      return;
    }

    const menu = Menu.buildFromTemplate(clone(template));
    const mainWindowId = store.getState().ui.mainWindow.id;
    const mainWindow = BrowserWindow.fromId(mainWindowId);
    menu.popup(mainWindow);
  });
}
