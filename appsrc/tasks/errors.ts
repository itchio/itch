
type ItchErrorType = "transition" | "crash" | "cancelled";

class ItchError extends Error {
  type: ItchErrorType;

  constructor (type: ItchErrorType) {
    super();
    this.type = type;
  }

  toString(): string {
    return this.type;
  }
}

interface ITransitionOpts {
  to: string;
  reason: string;
}

export class Transition extends ItchError {
  to: string;
  reason: string;

  constructor(opts: ITransitionOpts) {
    super("transition");
    this.to = opts.to;
    this.reason = opts.reason;
  }

  toString() {
    return `Transition(to ${this.to} because ${this.reason})`;
  }
}

interface ICrashOpts {
  error: string;
}

export class Crash extends ItchError {
  error: string;

  constructor(opts: ICrashOpts) {
    super("crash");
    this.error = opts.error;
  }

  toString() {
    return `application crashed. ${this.error || ""}`;
  }
}

export class Cancelled extends ItchError {
  constructor(opts: any = {}) {
    super("cancelled");
  }
}
