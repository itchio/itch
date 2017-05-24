
import {RequestFunc} from "../types";

let request: RequestFunc;

if (process.type === "renderer") {
  request = require("./chrome-request").request;
} else {
  request = require("./metal-request").request;
}

export {request};
