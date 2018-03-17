import { RequestError } from "node-buse";
import * as messages from "../buse/messages";

type ItchErrorCode =
  | "ITCH_ECRASH"
  | "ITCH_ECANCELLED"
  | "ITCH_EMISSINGLIBS"
  | "ITCH_ERETRY";

export class ItchError extends Error {
  constructor(public code: ItchErrorCode) {
    super();
  }

  toString(): string {
    return this.code;
  }
}

interface ICrashOpts {
  error: string;
}

export class Crash extends ItchError {
  error: string;

  constructor(opts: ICrashOpts) {
    super("ITCH_ECRASH");
    this.error = opts.error;
  }

  toString() {
    return `Application crashed. ${this.error || ""}`;
  }
}

interface IMissingLibsOpts {
  arch: string;
  libs: string[];
}

export class MissingLibs extends ItchError {
  arch: string;
  libs: string[];
  reason: any[];

  constructor(opts: IMissingLibsOpts) {
    super("ITCH_EMISSINGLIBS");
    this.arch = opts.arch || "386";
    this.libs = opts.libs || [];
    this.reason = [
      "game.install.libraries_missing",
      {
        arch: this.prettyArch(this.arch),
        libraries: this.libs.join(" "),
      },
    ];
  }

  prettyArch(arch: string): string {
    if (arch === "386") {
      return "32-bit";
    }

    if (arch === "amd64") {
      return "64-bit";
    }

    return arch;
  }

  toString() {
    return `${this.arch} libraries are missing: ${this.libs.join(", ")}`;
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

export class Retry extends ItchError {
  constructor(detail: string) {
    super("ITCH_ERETRY");
    this.message = `Retry: ${detail}`;
  }

  toString() {
    return this.message;
  }
}

export function isRetry(e: any): boolean {
  let ie = e as ItchError;
  return ie && ie.code === "ITCH_ERETRY";
}
