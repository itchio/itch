import nodeUtil from "util";

export let ItchPromise: typeof Promise;
export let promisify: typeof nodeUtil.promisify;

if (process.env.NODE_ENV === "production") {
  promisify = nodeUtil.promisify;
  ItchPromise = Promise;
} else {
  const bluebird = require("bluebird");
  promisify = bluebird.promisify;
  ItchPromise = bluebird.Promise;
}
