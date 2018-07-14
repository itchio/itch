import { LocalizedString } from "common/types";
import { Operation, OperationType } from "common/helpers/get-game-status";
import { DownloadReason } from "common/butlerd/messages";

export function formatOperation(op: Operation): LocalizedString {
  if (op.type === OperationType.Task) {
    if (op.name === "launch") {
      switch (op.stage) {
        case "prepare":
          return ["grid.item.running.prepare"];
        case "clean":
          return ["grid.item.running.clean"];
      }
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

export function formatReason(reason: DownloadReason): LocalizedString {
  switch (reason) {
    case "install":
      return ["download.reason.install"];
    case "update":
      return ["download.reason.update"];
    case "reinstall":
      return ["download.reason.reinstall"];
    default:
      return null;
  }
}

export function formatOutcome(reason: DownloadReason): LocalizedString {
  switch (reason) {
    case "install":
      return ["download.outcome.installed"];
    case "update":
      return ["download.outcome.updated"];
    case "reinstall":
      return ["download.outcome.reinstalled"];
    default:
      return null;
  }
}
