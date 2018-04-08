const isDev = require("electron-is-dev");
const isCanary = require("../package.json").name === "kitch";

const envName = process.env.NODE_ENV || (isDev ? "development" : "production");

export default {
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  development: envName === "development",
  production: envName === "production",
};
