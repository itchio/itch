import { MenuTemplate, MenuItem, Store } from "common/types";
import { actions } from "common/actions";

import getGameStatus, {
  Access,
  OperationType,
  Operation,
  withOwnedAccess,
} from "common/helpers/get-game-status";
import { showInExplorerString } from "common/format/show-in-explorer";
import { formatOperation } from "common/format/operation";
import { Game } from "common/butlerd/messages";
import { actionForGame } from "common/util/action-for-game";
import urls from "common/constants/urls";
import modals from "main/modals";

export function concatTemplates(
  a: MenuTemplate,
  b: MenuTemplate
): MenuTemplate {
  if (a.length === 0) {
    return b;
  }

  if (b.length === 0) {
    return a;
  }

  return [...a, { type: "separator" }, ...b];
}

/**
 * Menu for the install dialog's thumbnail: only the advanced
 * link-existing-folder action, none of the regular game controls -
 * everything else the game menu offers is already on that screen.
 */
export function adoptInstallMenu(game: Game): MenuTemplate {
  return [
    {
      id: "context--grid-item-adopt-install",
      localizedLabel: ["adopt_install.link_existing_folder"],
      action: actions.adoptGameInstall({ game }),
    },
  ];
}

export function gameControls(
  store: Store,
  game: Game,
  forceOwned?: boolean,
  showUploadBuild?: boolean
): MenuTemplate {
  let template: MenuTemplate = [];

  let status = getGameStatus(store.getState(), game);
  if (forceOwned) {
    status = withOwnedAccess(status);
  }
  const { cave, numCaves, operation } = status;

  const mainAction = actionForGame(game, cave);

  let statusItems: MenuTemplate = [];

  const itemForOperation = (operation: Operation): MenuItem => {
    const localizedLabel = formatOperation(operation);
    if (operation.type === OperationType.Task && operation.name === "launch") {
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
          { title: escapeForContextMenu(game.title) },
        ],
        action: actions.queueGame({ game }),
      });
    }

    let updateAndLocalItems: MenuTemplate = [];

    if (!busy) {
      updateAndLocalItems.push({
        localizedLabel: ["grid.item.check_for_update"],
        action: actions.checkForGameUpdate({
          caveId: cave.id,
          suppressNotification: false,
        }),
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

      uninstallReinstallItems.push({
        id: "context--grid-item-steam-shortcuts",
        localizedLabel: ["grid.item.steam_shortcuts"],
        action: actions.openSteamShortcutsDialog({ gameId: game.id }),
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
          localizedLabel: [
            "grid.item.install_title",
            { title: escapeForContextMenu(game.title) },
          ],
          action: actions.queueGame({ game }),
        });
      }
    }
  }

  // prepend status items
  template = concatTemplates(statusItems, template);

  if (showUploadBuild) {
    template = concatTemplates(template, [
      {
        id: "context--grid-item-upload-build",
        localizedLabel: ["upload.menu.push_new_build"],
        action: actions.openModal(
          modals.pushBuild.make({
            wind: "root",
            title: "Push new build",
            message: "",
            widgetParams: { prefilledGame: game },
          })
        ),
      },
    ]);
  }

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
      icon: "download",
      localizedLabel: ["preferences.advanced.check_game_updates"],
      id: "user-menu-check-for-updates",
      action: actions.checkForGameUpdates({}),
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

function escapeForContextMenu(label: string) {
  // In a context menu, '&[^&]' will be interpreted as a shortcut
  // definition. Escaping requires a second ampersand
  return label.replaceAll("&", "&&");
}
