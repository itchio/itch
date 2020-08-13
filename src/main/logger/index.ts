import { Logger, multiSink, streamSink, LogSink } from "common/logger";
import { mainLogPath } from "common/util/paths";
import stream from "logrotate-stream";
import { consoleSink } from "main/logger/console-sink";
import path from "path";
import * as mkdirp from "mkdirp";
import env from "common/env";

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

function buildMainLogger(): Logger {
  let fileSink = streamSink(getLogStream());

  let sink: LogSink;
  if (env.integrationTests) {
    sink = fileSink;
  } else {
    sink = multiSink(fileSink, consoleSink);
  }

  return new Logger(sink);
}

export const mainLogger = buildMainLogger();
