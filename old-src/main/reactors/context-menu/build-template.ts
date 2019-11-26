import { MenuTemplate, MenuItem, Store } from "common/types";
import { actions } from "common/actions";

import { isEmpty } from "underscore";
import getGameStatus, {
  Access,
  OperationType,
  Operation,
} from "common/helpers/get-game-status";
import { showInExplorerString } from "common/format/show-in-explorer";
import { formatOperation } from "common/format/operation";
import { Game } from "common/butlerd/messages";
import { actionForGame } from "common/util/action-for-game";
import urls from "common/constants/urls";

export function concatTemplates(
  a: MenuTemplate,
  b: MenuTemplate
): MenuTemplate {
  if (isEmpty(a)) {
    return b;
  }

  if (isEmpty(b)) {
    return a;
  }

  return [...a, { type: "separator" }, ...b];
}

export function newTabControls(
  store: Store,
  wind: string,
  tab: string
): MenuTemplate {
  return [
    {
      localizedLabel: ["menu.file.new_tab"],
      accelerator: "CmdOrCtrl+T",
      action: actions.newTab({ wind }),
    },
  ];
}

export function closeTabControls(
  store: Store,
  wind: string,
  tab: string
): MenuTemplate {
  // TODO: disable some menu items if last transient tab

  return [
    {
      localizedLabel: ["menu.file.close_tab"],
      accelerator: "CmdOrCtrl+W",
      action: actions.closeTab({ wind, tab }),
    },
    {
      localizedLabel: ["menu.file.close_other_tabs"],
      action: actions.closeOtherTabs({ wind, tab }),
    },
    {
      localizedLabel: ["menu.file.close_tabs_below"],
      action: actions.closeTabsBelow({ wind, tab }),
    },
  ];
}

export function gameControls(store: Store, game: Game): MenuTemplate {
  let template: MenuTemplate = [];

  const status = getGameStatus(store.getState(), game);
  const { cave, numCaves, operation } = status;

  const mainAction = actionForGame(game, cave);

  let statusItems: MenuTemplate = [];

  const itemForOperation = (operation: Operation): MenuItem => {
    const localizedLabel = formatOperation(operation);
    if (operation.name === "launch") {
      return {
        localizedLabel,
        submenu: [
          {
            localizedLabel: ["prompt.action.force_close"],
            action: actions.forceCloseGameRequest({ game }),
          },
        ],
      };
    } else {
      const item: MenuItem = {
        localizedLabel,
        enabled: false,
      };

      if (operation.type === OperationType.Download && operation.id) {
        item.submenu = [
          {
            localizedLabel: ["grid.item.discard_download"],
            action: actions.discardDownload({ id: operation.id }),
          },
        ];
      }
      return item;
    }
  };

  if (cave) {
    let busy = false;

    if (operation) {
      busy = true;
      statusItems.push(itemForOperation(operation));
    } else {
      statusItems.push({
        localizedLabel: [
          `grid.item.${mainAction}_title`,
          { title: game.title },
        ],
        action: actions.queueGame({ game }),
      });
    }

    let updateAndLocalItems: MenuTemplate = [];

    if (!busy) {
      updateAndLocalItems.push({
        localizedLabel: ["grid.item.check_for_update"],
        action: actions.checkForGameUpdate({ caveId: cave.id }),
      });
    }

    updateAndLocalItems.push({
      localizedLabel: showInExplorerString(),
      action: actions.exploreCave({ caveId: cave.id }),
    });

    template = concatTemplates(template, updateAndLocalItems);

    if (!busy) {
      let uninstallReinstallItems: MenuTemplate = [];
      uninstallReinstallItems.push({
        id: "context--grid-item-manage",
        localizedLabel: ["grid.item.manage"],
        action: actions.manageGame({ game }),
      });

      if (numCaves === 1) {
        uninstallReinstallItems.push({
          type: "separator",
        });
        uninstallReinstallItems.push({
          id: "context--grid-item-uninstall",
          localizedLabel: ["grid.item.uninstall"],
          action: actions.requestCaveUninstall({ caveId: cave.id }),
        });
      }

      template = concatTemplates(template, uninstallReinstallItems);
    }
  } else {
    if (operation) {
      statusItems.push(itemForOperation(operation));
    } else {
      if (status.access === Access.None) {
        if (game.canBeBought) {
          statusItems.push({
            localizedLabel: ["grid.item.buy_now"],
            action: actions.initiatePurchase({ game }),
          });
        } else {
          // welp
        }
      } else {
        // we have any kind of access
        statusItems.push({
          localizedLabel: ["grid.item.install_title", { title: game.title }],
          action: actions.queueGame({ game }),
        });
      }
    }
  }

  // prepend status items
  template = concatTemplates(statusItems, template);

  return template;
}

export function userMenu(store: Store): MenuTemplate {
  return [
    {
      icon: "rocket",
      localizedLabel: ["sidebar.view_creator_profile"],
      action: actions.viewCreatorProfile({}),
    },
    {
      icon: "fire",
      localizedLabel: ["sidebar.view_community_profile"],
      action: actions.viewCommunityProfile({}),
    },
    {
      type: "separator",
    },
    {
      icon: "download",
      localizedLabel: ["sidebar.downloads"],
      id: "user-menu-downloads",
      action: actions.navigate({
        wind: "root",
        url: "itch://downloads",
      }),
      accelerator: "CmdOrCtrl+J",
    },
    {
      icon: "cog",
      localizedLabel: ["sidebar.preferences"],
      id: "user-menu-preferences",
      action: actions.navigate({
        wind: "root",
        url: "itch://preferences",
      }),
      accelerator: "CmdOrCtrl+,",
    },
    {
      type: "separator",
    },
    {
      icon: "bug",
      localizedLabel: ["menu.help.report_issue"],
      action: actions.sendFeedback({}),
    },
    {
      icon: "lifebuoy",
      localizedLabel: ["menu.help.help"],
      action: actions.navigate({ wind: "root", url: urls.manual }),
    },
    {
      type: "separator",
    },
    {
      icon: "shuffle",
      localizedLabel: ["menu.account.change_user"],
      id: "user-menu-change-user",
      action: actions.changeUser({}),
    },
    {
      icon: "exit",
      localizedLabel: ["menu.file.quit"],
      action: actions.quit({}),
      accelerator: "CmdOrCtrl+Q",
    },
  ];
}
