import { mainLogPath } from "../os/paths";

import browserWrite from "./browser-write";
import consoleWrite from "./console-write";

import * as fs from "fs";
import * as path from "path";
import * as stream from "logrotate-stream";
const multi = require("multi-write-stream");

const LOG_LEVEL = (process.env.ITCH_LOG_LEVEL || "info") as Level;
const NO_STDOUT = process.env.ITCH_NO_STDOUT === "1";

export type Level = "silent" | "error" | "warn" | "info" | "debug";

const levelNumbers = {
  silent: 100,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
};

export const levels = {
  default: "USERLVL",
  60: "FATAL",
  50: "ERROR",
  40: "WARN",
  30: "INFO",
  20: "DEBUG",
  10: "TRACE",
};

export interface ILogEntry {
  time: number;
  level: number;
  msg: string;
  name?: string;
}

type IWrite = (entry: ILogEntry) => void;
type IClose = () => void;

export class Logger {
  private _name: string;
  private _write: IWrite;
  private _close: IClose;
  private _level: Level;
  private _levelNumber: number;

  constructor({
    write,
    close,
    name = undefined,
    level = "info",
  }: {
    write: IWrite;
    close?: IClose;
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
    if (this._close) {
      this._close();
    }
  }

  child({ name }: { name: string }): Logger {
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
    if (level >= this._levelNumber) {
      this._write({ time: Date.now(), level, msg, name: this._name });
    }
  }
}

export function makeLogger({
  logPath,
  customOut,
}: {
  logPath?: string;
  customOut?: NodeJS.WritableStream;
}): Logger {
  if (process.type === "renderer") {
    return new Logger({
      write: browserWrite,
      level: LOG_LEVEL,
    });
  } else {
    let consoleOut: NodeJS.WritableStream;
    let streamOutputs = [];

    if (!NO_STDOUT) {
      consoleOut = process.stdout;
    }

    if (logPath) {
      let hasDir = true;
      try {
        fs.mkdirSync(path.dirname(logPath));
      } catch (err) {
        if ((err as any).code === "EEXIST") {
          // good
        } else {
          console.log(
            `Could not create file sink: ${err.stack || err.message}`
          );
          hasDir = false;
        }
      }

      if (hasDir) {
        if (NO_STDOUT) {
          consoleOut = fs.createWriteStream(logPath);
        } else {
          const file = stream({
            file: logPath,
            size: "2M",
            keep: 5,
          });
          streamOutputs.push(file);
        }
      }
    }

    if (customOut) {
      streamOutputs.push(customOut);
    }

    const outStream = multi(streamOutputs);

    return new Logger({
      write: entry => {
        outStream.write(JSON.stringify(entry));
        outStream.write("\n");

        if (consoleOut) {
          consoleWrite(entry, consoleOut);
        }
      },
      close: () => {
        try {
          outStream.end();
        } catch (err) {
          console.log(`Could not close file sink: ${err.stack || err.message}`);
        }
      },
    });
  }
}

const defaultLogger = makeLogger({ logPath: mainLogPath() });

export const devNull = new Logger({
  write: () => {
    /* muffin */
  },
});

export default defaultLogger;
