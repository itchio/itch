import { levels, LogEntry, Logger, LOG_LEVEL } from "common/logger";
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

function write(entry: LogEntry) {
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
}

export default write;

import store from "renderer/store";

function makeLogger(): Logger {
  return new Logger({
    write: (entry: LogEntry) => {
      write(entry);
      store.dispatch(actions.log({ entry }));
    },
    level: LOG_LEVEL,
  });
}

export const rendererLogger = makeLogger();
