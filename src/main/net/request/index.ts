import { RequestFunc } from "common/types";

let request: RequestFunc;

if (process.type !== "browser") {
  throw new Error(`net/request cannot be loaded from ${process.type} process`);
}

request = require("./metal-request").request;
export { request };
