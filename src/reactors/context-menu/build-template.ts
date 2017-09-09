import { IMenuTemplate } from "../../types/index";
import * as actions from "../../actions";

import { isEmpty } from "underscore";
import getGameStatus, {
  Access,
  OperationType,
} from "../../helpers/get-game-status";
import { IGame } from "../../db/models/game";
import actionForGame from "../../util/action-for-game";
import Context from "../../context";
import { showInExplorerString } from "../../format/show-in-explorer";
import { formatOperation } from "../../format/operation";

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
  const { store } = ctx;

  return [
    {
      localizedLabel: ["menu.file.new_tab"],
      accelerator: "CmdOrCtrl+T",
      click: () => {
        store.dispatch(actions.newTab({}));
      },
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
      click: () => {
        store.dispatch(actions.closeTab({ tab }));
      },
      enabled: !isEssential,
    },
    {
      localizedLabel: ["menu.file.close_other_tabs"],
      click: () => {
        store.dispatch(actions.closeOtherTabs({ tab }));
      },
      enabled: !isEssential,
    },
    {
      localizedLabel: ["menu.file.close_tabs_below"],
      click: () => {
        store.dispatch(actions.closeTabsBelow({ tab }));
      },
      enabled: !isEssential,
    },
  ];
}

export function gameControls(ctx: Context, game: IGame): IMenuTemplate {
  const { store, db } = ctx;
  let template: IMenuTemplate = [];

  const status = getGameStatus(store.getState(), game);
  const { cave, operation } = status;

  const mainAction = actionForGame(game, cave);

  let statusItems: IMenuTemplate = [];

  if (cave) {
    let busy = false;

    if (operation) {
      busy = true;

      const localizedLabel = formatOperation(operation);
      if (operation.name === "launch") {
        statusItems.push({
          localizedLabel,
          submenu: [
            {
              localizedLabel: ["prompt.action.force_close"],
              click: () => store.dispatch(actions.abortGameRequest({ game })),
            },
          ],
        });
      } else {
        statusItems.push({
          localizedLabel,
          enabled: false,
        });
      }
    } else {
      statusItems.push({
        localizedLabel: [`grid.item.${mainAction}`],
        click: () => store.dispatch(actions.queueGame({ game })),
      });
    }

    let updateAndLocalItems: IMenuTemplate = [];

    if (!busy) {
      updateAndLocalItems.push({
        localizedLabel: ["grid.item.check_for_update"],
        click: () =>
          store.dispatch(
            actions.checkForGameUpdate({ caveId: cave.id, noisy: true })
          ),
      });
    }

    updateAndLocalItems.push({
      localizedLabel: showInExplorerString(),
      click: () => store.dispatch(actions.exploreCave({ caveId: cave.id })),
    });

    template = concatTemplates(template, updateAndLocalItems);

    let advancedItems: IMenuTemplate = [];

    const buildInfo = db.caves.get(k =>
      k.fields(["buildId"]).where("id = ?", cave.id)
    );
    if (buildInfo && buildInfo.buildId) {
      advancedItems = concatTemplates(advancedItems, [
        {
          localizedLabel: ["grid.item.verify_integrity"],
          click: () => store.dispatch(actions.healCave({ caveId: cave.id })),
        },
        {
          localizedLabel: ["grid.item.revert_to_version"],
          click: () =>
            store.dispatch(actions.revertCaveRequest({ caveId: cave.id })),
        },
      ]);
    }

    if (advancedItems.length > 0) {
      template = concatTemplates(template, [
        {
          localizedLabel: ["grid.item.advanced"],
          submenu: advancedItems,
        },
      ]);
    }

    let uninstallReinstallItems: IMenuTemplate = [];

    if (!busy) {
      uninstallReinstallItems.push({
        localizedLabel: ["grid.item.uninstall_request"],
        click: () =>
          store.dispatch(actions.requestCaveUninstall({ caveId: cave.id })),
      });
    }

    template = concatTemplates(template, uninstallReinstallItems);
  } else {
    if (operation) {
      if (operation.type === OperationType.Download) {
        statusItems.push({
          localizedLabel: ["grid.item.downloading"],
          click: () => store.dispatch(actions.navigate({ tab: "downloads" })),
        });
      } else {
        // uhh and we have no cave you say? that's weird
      }
    } else {
      if (status.access === Access.None) {
        if (game.canBeBought) {
          statusItems.push({
            localizedLabel: ["grid.item.buy_now"],
            click: () => store.dispatch(actions.initiatePurchase({ game })),
          });
        } else {
          // welp
        }
      } else {
        // we have any kind of access
        statusItems.push({
          localizedLabel: ["grid.item.install"],
          click: () => store.dispatch(actions.queueGame({ game })),
        });
      }
    }
  }

  // prepend status items
  template = concatTemplates(statusItems, template);

  return template;
}
