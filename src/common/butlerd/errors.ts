import { RequestError } from "@itchio/butlerd";
import { levels, LogEntry } from "common/logger";
import { formatDate, DATE_FORMAT } from "common/format/datetime";

export function asRequestError(e: Error): RequestError {
  const re = e as RequestError;
  if (re.rpcError) {
    return e as RequestError;
  }
  return null;
}

export function getRpcErrorData(e: Error): RequestError["rpcError"]["data"] {
  const re = asRequestError(e);
  if (re && re.rpcError && re.rpcError.data) {
    return re.rpcError.data;
  }
  return null;
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

export function getErrorStack(e: any): string {
  if (!e) {
    return "Unknown error";
  }

  let errorStack = e.stack;

  const re = asRequestError(e);
  if (re) {
    const ed = getRpcErrorData(e);
    if (ed && ed.stack) {
      // use golang stack if available
      errorStack = ed.stack;
    } else if (re.message) {
      // or just message
      errorStack = re.message;
    }
  }
  return errorStack;
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
