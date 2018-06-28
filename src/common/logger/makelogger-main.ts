import { Logger, MakeLoggerOpts, LOG_LEVEL } from "common/logger";
import fs from "fs";
import stream from "logrotate-stream";
import path from "path";
import write from "./write-main";

const multi = require("multi-write-stream");
const NO_STDOUT = process.env.ITCH_NO_STDOUT === "1";

export function makeLogger({ logPath, customOut }: MakeLoggerOpts): Logger {
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
        console.log(`Could not create file sink: ${err.stack || err.message}`);
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

  const logger = new Logger({
    write: entry => {
      outStream.write(JSON.stringify(entry));
      outStream.write("\n");

      if (consoleOut) {
        write(entry, consoleOut);
      }
    },
    level: LOG_LEVEL,
    close: () => {
      try {
        outStream.end();
      } catch (err) {
        console.log(`Could not close file sink: ${err.stack || err.message}`);
      }
    },
  });
  logger.customOut = customOut;
  return logger;
}
