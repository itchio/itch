
/**
 * Returns true if this is a network error
 */
export function isNetworkError (e: Error) {
  // this operates under the assumption that:
  //   * all our internal network errors should start with "err::"
  //   * all of chrome's already do
  //   * we transform fetch's into err:: variants.
  // we coerce e.message into a string on the off chance that it's not defined
  // or not a string.
  return (e && ("" + e.message).indexOf("net::") === 0);
}

export class RequestError extends Error {
  constructor (message: string) {
    super("net::REQUEST_ERROR::" + message);
  }
}

export class RequestTimeout extends RequestError {
  constructor () {
    super("TIMED_OUT");
  }
}

export class RequestAborted extends RequestError {
  constructor () {
    super("ABORTED");
  }
}

export class RequestFormattingFailure extends RequestError {
  constructor (message: string) {
    super("FORMATTING_FAILURE: " + message);
  }
}

export class RequestParsingFailure extends RequestError {
  constructor (message: string) {
    super("PARSING_FAILURE: " + message);
  }
}
