import { IMenuTemplate, IMenuItem } from "../../types/index";
import * as actions from "../../actions";

import { isEmpty } from "underscore";
import getGameStatus, {
  Access,
  OperationType,
  IOperation,
} from "../../helpers/get-game-status";
import actionForGame from "../../util/action-for-game";
import Context from "../../context";
import { showInExplorerString } from "../../format/show-in-explorer";
import { formatOperation } from "../../format/operation";
import { Game } from "ts-itchio-api";

export function concatTemplates(
  a: IMenuTemplate,
  b: IMenuTemplate
): IMenuTemplate {
  if (isEmpty(a)) {
    return b;
  }

  if (isEmpty(b)) {
    return a;
  }

  return [...a, { type: "separator" }, ...b];
}

export function newTabControls(ctx: Context, tab: string): IMenuTemplate {
  return [
    {
      localizedLabel: ["menu.file.new_tab"],
      accelerator: "CmdOrCtrl+T",
      action: actions.newTab({}),
    },
  ];
}

export function closeTabControls(ctx: Context, tab: string): IMenuTemplate {
  const { store } = ctx;

  // TODO: disable some menu items if last transient tab, or constant tab
  const isEssential =
    store.getState().session.navigation.tabs.constant.indexOf(tab) !== -1;

  return [
    {
      localizedLabel: ["menu.file.close_tab"],
      accelerator: "CmdOrCtrl+W",
      action: actions.closeTab({ tab }),
      enabled: !isEssential,
    },
    {
      localizedLabel: ["menu.file.close_other_tabs"],
      action: actions.closeOtherTabs({ tab }),
      enabled: !isEssential,
    },
    {
      localizedLabel: ["menu.file.close_tabs_below"],
      action: actions.closeTabsBelow({ tab }),
      enabled: !isEssential,
    },
  ];
}

export function gameControls(ctx: Context, game: Game): IMenuTemplate {
  const { store, db } = ctx;
  let template: IMenuTemplate = [];

  const status = getGameStatus(store.getState(), game);
  const { cave, operation } = status;

  const mainAction = actionForGame(game, cave);

  let statusItems: IMenuTemplate = [];

  const itemForOperation = (operation: IOperation): IMenuItem => {
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
      const item: IMenuItem = {
        localizedLabel,
        enabled: false,
      };

      if (operation.type === OperationType.Download && operation.id) {
        item.submenu = [
          {
            localizedLabel: ["grid.item.discard_download"],
            action: actions.discardDownloadRequest({ id: operation.id }),
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
        localizedLabel: [`grid.item.${mainAction}`],
        action: actions.queueGame({ game }),
      });
    }

    let updateAndLocalItems: IMenuTemplate = [];

    if (!busy) {
      updateAndLocalItems.push({
        localizedLabel: ["grid.item.check_for_update"],
        action: actions.checkForGameUpdate({ caveId: cave.id, noisy: true }),
      });
    }

    updateAndLocalItems.push({
      localizedLabel: showInExplorerString(),
      action: actions.exploreCave({ caveId: cave.id }),
    });

    template = concatTemplates(template, updateAndLocalItems);

    if (!busy) {
      let advancedItems: IMenuTemplate = [];

      const buildInfo = db.caves.get(k =>
        k.fields(["build"]).where("id = ?", cave.id)
      );
      if (buildInfo && buildInfo.build) {
        advancedItems = concatTemplates(advancedItems, [
          {
            localizedLabel: ["grid.item.verify_integrity"],
            action: actions.healCave({ caveId: cave.id }),
          },
          {
            localizedLabel: ["grid.item.revert_to_version"],
            action: actions.revertCaveRequest({ caveId: cave.id }),
          },
        ]);
      }

      if (!isEmpty(advancedItems)) {
        template = concatTemplates(template, [
          {
            localizedLabel: ["grid.item.advanced"],
            submenu: advancedItems,
          },
        ]);
      }
    }

    if (!busy) {
      let uninstallReinstallItems: IMenuTemplate = [];
      uninstallReinstallItems.push({
        id: "context--grid-item-uninstall-request",
        localizedLabel: ["grid.item.uninstall_request"],
        action: actions.requestCaveUninstall({ caveId: cave.id }),
      });

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
          localizedLabel: ["grid.item.install"],
          action: actions.queueGame({ game }),
        });
      }
    }
  }

  // prepend status items
  template = concatTemplates(statusItems, template);

  return template;
}
