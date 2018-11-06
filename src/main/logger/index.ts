import { Logger, multiSink, streamSink } from "common/logger";
import { mainLogPath } from "common/util/paths";
import stream from "logrotate-stream";
import { consoleSink } from "main/logger/console-sink";
import path from "path";
import * as mkdirp from "mkdirp";

export function getLogStream(): NodeJS.WritableStream {
  const logPath = mainLogPath();
  try {
    mkdirp.sync(path.dirname(logPath));
  } catch (err) {
    if ((err as any).code === "EEXIST") {
      // good
    } else {
      console.log(`Could not create file sink: ${err.stack || err.message}`);
    }
  }

  return stream({
    file: logPath,
    size: "2M",
    keep: 5,
  });
}

export const mainLogger = new Logger(
  multiSink(streamSink(getLogStream()), consoleSink)
);
