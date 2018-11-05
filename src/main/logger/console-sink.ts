import { LogEntry, levels, LogSink } from "common/logger";
const termColor = require("term-color");

const levelColors = {
  default: "white",
  60: "bgRed",
  50: "red",
  40: "yellow",
  30: "green",
  20: "blue",
  10: "grey",
} as { [key: number]: string; default: string };

function asISODate(time: any) {
  return new Date(time).toISOString();
}

function asColoredLevel(entry: LogEntry) {
  const formatter = termColor[levelColors[entry.level]];
  const str = levels[entry.level];
  if (formatter) {
    return formatter(str);
  }
  return str;
}

export const consoleSink: LogSink = {
  write(entry: LogEntry) {
    let line =
      asISODate(entry.time).split(/T|Z/)[1] + " " + asColoredLevel(entry);
    line += " ";
    if (entry.name) {
      line += "(" + entry.name + ") ";
    }
    if (entry.msg) {
      line += termColor.cyan(entry.msg);
    }
    line += "\n";
    process.stdout.write(line);
  },
};
