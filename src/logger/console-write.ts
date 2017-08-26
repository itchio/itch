import { ILogEntry, levels } from "./index";
const chalkModule = require("chalk");
const chalk = new chalkModule.constructor({ enabled: true });

const levelColors = {
  default: chalk.white,
  60: chalk.bgRed,
  50: chalk.red,
  40: chalk.yellow,
  30: chalk.green,
  20: chalk.blue,
  10: chalk.grey,
};

function asISODate(time) {
  return new Date(time).toISOString();
}

function asColoredLevel(value) {
  if (levelColors.hasOwnProperty(value.level)) {
    return levelColors[value.level](levels[value.level]);
  } else {
    return levelColors.default(levels.default);
  }
}

export default function write(entry: ILogEntry, stream: NodeJS.WritableStream) {
  let line = asISODate(entry.time) + " " + asColoredLevel(entry);
  line += " ";
  if (entry.name) {
    line += "(" + entry.name + ") ";
  }
  if (entry.msg) {
    line += chalk.cyan(entry.msg);
  }
  line += "\n";
  stream.write(line);
}
