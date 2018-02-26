import { actions } from "../../actions";

import { IDownloadKey } from "../../db/models/download-key";
import { ICaveSummary } from "../../db/models/cave";

import {
  ClassificationAction,
  ILocalizedString,
  ITask,
  IAction,
} from "../../types";

import { showInExplorerString } from "../../format/show-in-explorer";
import { Game } from "../../buse/messages";

export type ActionType = "secondary" | "separator" | "info";

export interface IActionOpts {
  type?: ActionType;
  label?: ILocalizedString;
  icon?: string;
  action?: IAction<any>;
  classes?: string[];
}

function browseAction(caveId: string): IActionOpts {
  return {
    type: "secondary",
    label: showInExplorerString(),
    icon: "folder-open",
    action: actions.exploreCave({ caveId }),
  };
}

function purchaseAction(game: Game, downloadKey: IDownloadKey): IActionOpts {
  const donate = game.minPrice === 0;

  if (donate) {
    return {
      label: ["grid.item.donate"],
      icon: "heart-filled",
      action: actions.initiatePurchase({ game }),
      classes: ["generous"],
    };
  } else {
    return {
      label: ["grid.item.buy_now"],
      icon: "shopping_cart",
      action: actions.initiatePurchase({ game }),
      classes: ["generous"],
    };
  }
}

function uninstallAction(caveId: string): IActionOpts {
  return {
    label: ["grid.item.uninstall"],
    icon: "uninstall",
    action: actions.requestCaveUninstall({ caveId }),
  };
}

interface IListSecondaryActionsProps {
  game: Game;
  cave: ICaveSummary;
  downloadKey: IDownloadKey;

  mayDownload: boolean;
  canBeBought: boolean;

  action: ClassificationAction;

  tasks: ITask[];
}

export default function listSecondaryActions(
  props: IListSecondaryActionsProps
) {
  const {
    game,
    cave,
    mayDownload,
    canBeBought,
    downloadKey,
    action,
    tasks,
  } = props;
  let error = false;

  const items: IActionOpts[] = [];

  if (cave) {
    // No errors
    if (canBeBought) {
      items.push(purchaseAction(game, downloadKey));
    }

    items.push({
      type: "separator",
    });

    if (action !== "open") {
      items.push(browseAction(cave.id));
    }

    let busy = false;

    if (tasks && tasks.length > 0) {
      busy = true;
    }

    if (!busy) {
      items.push({
        type: "secondary",
        icon: "repeat",
        label: ["grid.item.check_for_update"],
        action: actions.checkForGameUpdate({ caveId: cave.id, noisy: true }),
      });

      items.push(uninstallAction(cave.id));
    }
  } else {
    // No cave
    const hasMinPrice = game.minPrice > 0;
    const mainIsPurchase = !mayDownload && hasMinPrice && canBeBought;

    if (!mainIsPurchase && canBeBought) {
      items.push(purchaseAction(game, downloadKey));
    }

    items.push({
      type: "separator",
    });
  }

  return { error, items };
}
