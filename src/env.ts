const isDev = require("electron-is-dev");
const isCanary = require("../package.json").name === "kitch";

export default {
  name:
    process.env.ITCH_APP_ENV ||
    process.env.NODE_ENV ||
    (isDev ? "development" : "production"),
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
};
