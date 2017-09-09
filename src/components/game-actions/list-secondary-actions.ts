import * as actions from "../../actions";

import { IGame } from "../../db/models/game";
import { IDownloadKey } from "../../db/models/download-key";
import { ICaveSummary } from "../../db/models/cave";

import { ClassificationAction, ILocalizedString, ITask } from "../../types";

import { IAction } from "../../constants/action-types";

import { InjectedIntl } from "react-intl";
import { showInExplorerString } from "../../format/show-in-explorer";

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

function purchaseAction(
  game: IGame,
  downloadKey: IDownloadKey,
  intl: InjectedIntl
): IActionOpts {
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
  game: IGame;
  cave: ICaveSummary;
  downloadKey: IDownloadKey;

  mayDownload: boolean;
  canBeBought: boolean;

  action: ClassificationAction;

  tasks: ITask[];

  intl: InjectedIntl;
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
    intl,
  } = props;
  let error = false;

  const items: IActionOpts[] = [];

  if (cave) {
    // No errors
    if (canBeBought) {
      items.push(purchaseAction(game, downloadKey, intl));
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
      items.push(purchaseAction(game, downloadKey, intl));
    }

    items.push({
      type: "separator",
    });
  }

  return { error, items };
}
