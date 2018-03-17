const isDev = require("electron-is-dev");
const isCanary = require("../package.json").name === "kitch";

const envName =
  process.env.ITCH_APP_ENV ||
  process.env.NODE_ENV ||
  (isDev ? "development" : "production");

// foil babel inline-node-env, and make
// react/index happy
process.env["NODE_ENV" + ""] = envName;

export default {
  name: envName,
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  unitTests: false,
};
