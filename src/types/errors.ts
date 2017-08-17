type ItchErrorType = "crash" | "cancelled" | "missing-libs";

class ItchError extends Error {
  type: ItchErrorType;

  constructor(type: ItchErrorType) {
    super();
    this.type = type;
  }

  toString(): string {
    return this.type;
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

interface IMissingLibsOpts {
  arch: string;
  libs: string[];
}

export class MissingLibs extends ItchError {
  arch: string;
  libs: string[];
  reason: any[];

  constructor(opts: IMissingLibsOpts) {
    super("missing-libs");
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
    super("cancelled");
    this.detail = detail;
    this.message = `operation was cancelled: ${this.detail}`;
  }
}
