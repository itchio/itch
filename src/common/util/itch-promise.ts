import nodeUtil from "util";
import env from "../env";

export let ItchPromise: typeof Promise;
export let promisify: typeof nodeUtil.promisify;

if (env.development) {
  promisify = nodeUtil.promisify;
  ItchPromise = Promise;
} else {
  const bluebird = require("bluebird");
  promisify = bluebird.promisify;
  ItchPromise = bluebird.Promise;
}
