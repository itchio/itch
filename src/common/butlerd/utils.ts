import {
  asRequestError,
  getErrorStack,
  InternalCode,
} from "@itchio/valet/support";

import { Cave, CaveSummary, Code } from "@itchio/valet/messages";
import { DATE_FORMAT, formatDate } from "common/format/datetime";
import { levels, LogEntry } from "common/logger";

export function getCaveSummary(cave: Cave): CaveSummary {
  return {
    id: cave.id,
    gameId: cave.game.id,
    lastTouchedAt: cave.stats.lastTouchedAt,
    secondsRun: cave.stats.secondsRun,
    installedSize: cave.installInfo.installedSize,
  };
}

export function getErrorMessage(e: any): string {
  if (!e) {
    return "Unknown error";
  }

  // TODO: this is a good place to do i18n on butlerd error codes!
  let errorMessage = e.message;
  const re = e.rpcError;
  if (re) {
    if (re.message) {
      // use just the json-rpc message if possible
      errorMessage = re.message;
    }
  }
  return errorMessage;
}

export function isInternalError(e: any): boolean {
  const re = asRequestError(e);

  if (!re) {
    return true;
  }

  if (re.rpcError.code < 0) {
    return true;
  }
  return false;
}

export function mergeLogAndError(log: string, e: any): string {
  let formattedLog = "";
  if (log) {
    let lines = log.split("\n");
    for (let line of lines) {
      line = line.trim();
      let fallback = false;
      try {
        const obj = JSON.parse(line) as LogEntry;
        if (obj.msg) {
          let date = formatDate(new Date(obj.time), "en-US", DATE_FORMAT);
          let level = levels[obj.level];
          let { msg } = obj;
          formattedLog += `${date} [${level}] ${msg}\n`;
        } else {
          fallback = true;
        }
      } catch (e) {
        fallback = true;
      }

      if (fallback) {
        formattedLog += `${line}\n`;
      }
    }
  }

  return `${formattedLog}\n\nError stack:\n${getErrorStack(e)}\n`;
}

export function isCancelled(e: Error): boolean {
  let re = asRequestError(e);
  if (re) {
    let code = re.rpcError.code;
    if (
      code === Code.OperationCancelled ||
      code === InternalCode.ConversationCancelled
    ) {
      return true;
    }
  }

  return false;
}
