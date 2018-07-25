function parseEnvLevel() {
  let l = process.env.ITCH_LOG_LEVEL;
  if (l) {
    const validLevels = ["silent", "error", "warn", "info", "debug"];
    if (validLevels.indexOf(l) !== -1) {
      return l;
    }
    console.warn(
      `Ignoring ITCH_LOG_LEVEL=${l}, expected one of: ${validLevels.join(", ")}`
    );
  }
  return "info";
}

export const LOG_LEVEL = parseEnvLevel() as Level;

type Level = "silent" | "error" | "warn" | "info" | "debug";

const levelNumbers = {
  silent: 100,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
} as { [key: string]: number };

export const levels = {
  default: "USERLVL",
  60: "FATAL",
  50: "ERROR",
  40: "WARN",
  30: "INFO",
  20: "DEBUG",
  10: "TRACE",
} as { [key: number]: string; default: string };

export interface LogEntry {
  time: number;
  level: number;
  msg: string;
  name?: string;
}

type Write = (entry: LogEntry) => void;
type Close = () => void;

export class Logger {
  private _name: string;
  private _write: Write;
  private _close: Close;
  private _level: Level;
  private _levelNumber: number;
  private closed: boolean;
  customOut?: any;

  constructor({
    write,
    close,
    name = undefined,
    level = "info",
  }: {
    write: Write;
    close?: Close;
    name?: string;
    level?: Level;
  }) {
    this._name = name;
    this._write = write;
    this._close = close;
    this._level = level;
    this._levelNumber = levelNumbers[level];
  }

  debug(msg: string) {
    this.log(levelNumbers.debug, msg);
  }

  info(msg: string) {
    this.log(levelNumbers.info, msg);
  }

  warn(msg: string) {
    this.log(levelNumbers.warn, msg);
  }

  error(msg: string) {
    this.log(levelNumbers.error, msg);
  }

  close() {
    this.closed = true;
    if (this._close) {
      this._close();
    }
  }

  child(filename: string): Logger {
    let tokens = filename.split(/[\/\\]/);
    tokens = tokens.slice(1);
    tokens[0] = tokens[0].substring(0, 1);
    for (let i = 1; i < tokens.length - 1; i++) {
      tokens[i] = tokens[i].substring(0, 4);
    }
    let name = tokens.join("/");
    name = name.replace(/\.[^.]+$/, "");
    return this.childWithName(name);
  }

  childWithName(name: string): Logger {
    const l = new Logger({
      write: this._write,
      close: this._close,
      level: this._level,
      name,
    });
    return l;
  }

  setLevel(level: Level) {
    this._level = level;
    this._levelNumber = levelNumbers[level];
  }

  private log(level: number, msg: string) {
    if (this.closed) {
      return;
    }

    if (level >= this._levelNumber) {
      this._write({ time: Date.now(), level, msg, name: this._name });
    }
  }

  write(entry: LogEntry) {
    this._write(entry);
  }
}

export const devNull = new Logger({
  write: () => {
    /* muffin */
  },
});
