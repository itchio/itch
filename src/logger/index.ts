import { logPath } from "../os/paths";
import { Logger as PinoLogger, Level } from "pino";
import { Stream, Writable } from "stream";

import env from "../env";

const LOG_LEVEL = process.env.ITCH_LOG_LEVEL || ("info" as Level);
const NO_STDOUT = process.env.ITCH_NO_STDOUT === "1";

// tslint:disable-next-line
export interface Logger extends PinoLogger {
  close();
  child(props: { name: string }): Logger;
}

let pinoFactory: (opts?: any, stream?: Stream) => Logger;

const levels = {
  default: "USERLVL",
  60: "FATAL",
  50: "ERROR",
  40: "WARN",
  30: "INFO",
  20: "DEBUG",
  10: "TRACE",
};

const levelColors = {
  default: "color:black;",
  60: "background-color:red;",
  50: "color:red;",
  40: "color:yellow;",
  30: "color:green;",
  20: "color:blue;",
  10: "color:grey;",
};

export function makeLogger(logPath?: string): Logger {
  if (process.type === "renderer") {
    if (!pinoFactory) {
      pinoFactory = require("pino/browser");
    }
    const l = pinoFactory({
      browser: {
        write: (opts: any) => {
          const { name, level, msg } = opts;
          // tslint:disable-next-line
          console.log(
            "%c " +
              levels[level] +
              " %c" +
              (name ? "(" + name + ")" : "") +
              ":" +
              " %c" +
              msg,
            levelColors[level],
            "color:black;",
            "color:44e;",
          );
        },
      },
      level: LOG_LEVEL,
    });
    l.close = () => {
      /* muffin */
    };
    return l;
  } else {
    const multiwriter = require("multiwriter");
    const fs = require("fs");
    const path = require("path");
    const stream = require("logrotate-stream");
    const pretty = require("./pretty");

    let consoleOut = pretty({
      forceColor: true,
    });

    consoleOut.pipe(process.stdout);

    let streamSpecs: {
      consoleOut?: Stream;
      file?: Writable;
    } = {};

    if (!NO_STDOUT) {
      streamSpecs.consoleOut = consoleOut;
    }

    if (logPath) {
      let hasDir = true;
      try {
        fs.mkdirSync(path.dirname(logPath));
      } catch (err) {
        if ((err as any).code === "EEXIST") {
          // good
        } else {
          // tslint:disable-next-line
          console.log(
            `Could not create file sink: ${err.stack || err.message}`,
          );
          hasDir = false;
        }
      }

      if (hasDir) {
        if (NO_STDOUT) {
          streamSpecs.file = pretty({ forceColor: true });
          streamSpecs.file.pipe(fs.createWriteStream(logPath));
        } else {
          streamSpecs.file = stream({
            file: logPath,
            size: "2M",
            keep: 5,
          });
        }
      }
    }

    const outStream = multiwriter.create(streamSpecs);
    if (!pinoFactory) {
      pinoFactory = require("pino");
    }

    const l = pinoFactory(
      {
        timestamp: true,
        level: LOG_LEVEL,
      },
      outStream,
    );
    l.close = () => {
      if (streamSpecs.file) {
        try {
          streamSpecs.file.end();
        } catch (err) {
          // tslint:disable-next-line
          console.log(`Could not close file sink: ${err.stack || err.message}`);
        }
      }
    };
    return l;
  }
}

const defaultLogger = makeLogger(logPath());

if (process.type === "browser") {
  const { app } = require("electron");
  defaultLogger.info(
    `${env.appName} ${app.getVersion()} on electron ${process.versions
      .electron} in ${env.name}`,
  );
}

export const devNull: Logger = new class {
  level: Level = "silent";
  levelVal = 0;
  levels = {
    values: {},
    labels: {},
  };
  LOG_VERSION = 0;
  stdSerializers = null;

  child() {
    return this;
  }
  on(ev: any, list: any) {
    /* muffin */
  }
  fatal(...args: any[]) {
    /* muffin */
  }
  error(...args: any[]) {
    /* muffin */
  }
  warn(...args: any[]) {
    /* muffin */
  }
  info(...args: any[]) {
    /* muffin */
  }
  debug(...args: any[]) {
    /* muffin */
  }
  trace(...args: any[]) {
    /* muffin */
  }
  close() {
    /* muffin */
  }
}();

export default defaultLogger;
