import { LogEntry, levels } from "./index";

const levelColors = {
  default: "color:black;",
  60: "background-color:red;",
  50: "color:red;",
  40: "color:yellow;",
  30: "color:green;",
  20: "color:blue;",
  10: "color:grey;",
};

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
