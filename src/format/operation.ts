import { ILocalizedString } from "../types/index";
import { IOperation, OperationType } from "../helpers/get-game-status";
import { DownloadReason } from "../types/tasks";

export function formatOperation(op: IOperation): ILocalizedString {
  if (op.type === OperationType.Task) {
    if (op.name === "launch") {
      return ["grid.item.running"];
    } else if (op.name === "uninstall") {
      return ["grid.item.uninstalling"];
    } else {
      return ["grid.item.installing"];
    }
  } else if (op.type === OperationType.Download) {
    return ["grid.item.downloading"];
  } else {
    return null;
  }
}

export function formatReason(reason: DownloadReason): ILocalizedString {
  switch (reason) {
    case "install":
      return ["download.reason.install"];
    case "update":
      return ["download.reason.update"];
    case "reinstall":
      return ["download.reason.reinstall"];
    case "revert":
      return ["download.reason.revert"];
    case "heal":
      return ["download.reason.heal"];
    default:
      return null;
  }
}

export function formatOutcome(reason: DownloadReason): ILocalizedString {
  switch (reason) {
    case "install":
      return ["download.outcome.installed"];
    case "update":
      return ["download.outcome.updated"];
    case "reinstall":
      return ["download.outcome.reinstalled"];
    case "revert":
      return ["download.outcome.reverted"];
    case "heal":
      return ["download.outcome.healed"];
    default:
      return null;
  }
}
