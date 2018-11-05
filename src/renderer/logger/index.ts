import { levels, LogEntry, Logger, LogSink, multiSink } from "common/logger";
import { actions } from "common/actions";

const levelColors = {
  default: "color:black;",
  60: "background-color:red;",
  50: "color:red;",
  40: "color:yellow;",
  30: "color:green;",
  20: "color:blue;",
  10: "color:grey;",
} as { [key: number]: string };

const consoleSink: LogSink = {
  write(entry: LogEntry) {
    const { name, level, msg } = entry;
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
      "color:44e;"
    );
  },
};

import store from "renderer/store";

const remoteSink: LogSink = {
  write(entry: LogEntry) {
    store.dispatch(actions.log({ entry }));
  },
};

export const rendererLogger = new Logger(multiSink(consoleSink, remoteSink));
