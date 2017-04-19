
import { pairs } from "underscore";
import * as colors from "colors/safe";

import * as fs from "fs";
import * as format from "../util/format";
import * as path from "path";
import * as eol from "eol";
import * as deepAssign from "deep-assign";
import * as stream from "logrotate-stream";

// tslint:disable:no-console

interface ILogExport {
  (message: string): any;
  Logger: any;
}

let make: ILogExport;

make = function (name: string): ILogExport {
  let f: ILogExport;

  f = function (opts: any, message: string) {
    if (opts && opts.logger) {
      opts.logger.log(`[${name}] ${message}`);
    }
  } as any;
  f.Logger = Logger;
  return f;
} as any;

const allColors = "red green yellow blue magenta cyan white gray".split(" ");

interface IStream {
  write(contents: string): void;
  end(): void;
}

export class Logger {
  /** if true, print message to console */
  consoleSink: boolean;

  /** if true, accumulate output in .contents */
  stringSink: boolean;
  contents: string;

  fileSink: IStream;

  opts: any;

  colorCache: any;

  constructor(userOpts: any) {
    if (typeof userOpts === "undefined") {
      userOpts = {};
    }

    let defaultOpts = { sinks: { console: true } };
    let opts = deepAssign({}, defaultOpts, userOpts);
    this.opts = opts;

    let sinks = opts.sinks;

    this.consoleSink = false;
    this.stringSink = false;
    this.fileSink = null;
    this.contents = "";

    for (const pair of pairs(sinks)) {
      const key = pair[0];
      const val = pair[1];

      switch (key) {
        case "console": {
          this.consoleSink = !!val;
          break;
        }

        case "file": {
          if (val) {
            // XXX bad, but we're in a constructor, not seeing many other options
            try {
              fs.mkdirSync(path.dirname(val));
            } catch (err) {
              if ((err as any).code === "EEXIST") {
                // good
              } else {
                console.log(`Could not create file sink: ${err.stack || err.message}`);
              }
            }

            this.fileSink = stream({
              file: val,
              size: "2M",
              keep: 5,
            });
          }
          break;
        }

        case "stream": {
          this.fileSink = val;
          break;
        }

        case "string": {
          this.stringSink = !!val;
          break;
        }

        default: {
          // no other types supported
          break;
        }
      }
    }
  }

  log(message: string) {
    this.write(this.timestamp(), `${message}`);
  }

  nameToColor(name: string): string {
    this.colorCache = this.colorCache || {};

    if (this.colorCache[name]) {
      return this.colorCache[name];
    }

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash += name.charCodeAt(i);
    }
    hash = hash % allColors.length;
    this.colorCache[name] = allColors[hash];

    return this.colorCache[name];
  }

  write(timestamp: string, s: string) {
    if (this.stringSink) {
      this.contents += eol.auto(`[${timestamp}] ${s}` + "\n");
    }

    if (this.consoleSink) {
      const matches = /^\[([^\]]*)\]/.exec(s);
      if (matches) {
        const color = this.nameToColor(matches[1]);
        console.log(timestamp + " " + colors[color](s));
      } else {
        console.log(`${timestamp} ${s}`);
      }
    }

    if (this.fileSink) {
      this.fileSink.write(eol.auto(`${timestamp} ${s}` + "\n"));
    }
  }

  close() {
    if (this.fileSink) {
      this.fileSink.end();
    }
  }

  timestamp(): string {
    return "[" + format.date(Date.now(), "YYYY-MM-DD @ HH:mm:ss.SSS") + "]";
  }
}
make.Logger = Logger;

export default make;
