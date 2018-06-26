import { asRequestError } from "common/butlerd";
import { Code } from "common/butlerd/messages";

/**
 * Returns true if this is a network error
 */
export function isNetworkError(e: Error) {
  // this operates under the assumption that:
  //   * all our internal network errors should start with "err::"
  //   * all of chrome's already do
  //   * we transform fetch's into err:: variants.
  // we coerce e.message into a string on the off chance that it's not defined
  // or not a string.
  const isJavaScriptNetworkError = e && ("" + e.message).indexOf("net::") === 0;
  if (isJavaScriptNetworkError) {
    return true;
  }

  const re = asRequestError(e);
  if (re) {
    if (re.rpcError.code === Code.NetworkDisconnected) {
      return true;
    }
  }

  return false;
}

export class RequestError extends Error {
  constructor(message: string) {
    super(message.indexOf("net::") == 0 ? message : "net::REQUEST_ERROR::");
  }
}

export class RequestTimeout extends RequestError {
  constructor() {
    super("TIMED_OUT");
  }
}

export class RequestAborted extends RequestError {
  constructor() {
    super("ABORTED");
  }
}

export class RequestFormattingFailure extends RequestError {
  constructor(message: string) {
    super("FORMATTING_FAILURE: " + message);
  }
}

export class RequestParsingFailure extends RequestError {
  constructor(message: string) {
    super("PARSING_FAILURE: " + message);
  }
}
