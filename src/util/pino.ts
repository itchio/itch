
import {Logger} from "pino";

let p: Logger;
if (process.type === "renderer") {
  p = require("pino/browser")();
} else {
  p = require("pino")();
}

export default p;
