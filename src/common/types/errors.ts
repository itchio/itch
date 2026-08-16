import { RequestError } from "@itchio/butlerd";
import * as messages from "common/butlerd/messages";

type ItchErrorCode = "ITCH_ECANCELLED";

class ItchError extends Error {
  constructor(public code: ItchErrorCode) {
    super();
  }

  override toString(): string {
    return this.code;
  }
}

export class Cancelled extends ItchError {
  detail: string;

  constructor(detail = "generic cancellation") {
    super("ITCH_ECANCELLED");
    this.detail = detail;
    this.message = `Operation was cancelled: ${this.detail}`;
  }
}

export function isCancelled(e: any): boolean {
  if (!e) {
    return false;
  }

  let ie = e as ItchError;
  if (ie.code === "ITCH_ECANCELLED") {
    return true;
  }

  let je = e as RequestError;
  if (je.rpcError && je.rpcError.code === messages.Code.OperationCancelled) {
    return true;
  }

  return false;
}

export function isAborted(e: any): boolean {
  if (!e) {
    return false;
  }

  let je = e as RequestError;
  if (je.rpcError && je.rpcError.code === messages.Code.OperationAborted) {
    return true;
  }

  return false;
}
