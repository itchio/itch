const isDev = require("electron-is-dev");
import { app, remote } from "electron";
const isCanary = (app || remote.app).getName() === "kitch";

const envName = process.env.NODE_ENV || (isDev ? "development" : "production");
process.env[["NODE", "ENV"].join("_")] = envName;

export default {
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  development: envName === "development",
  production: envName === "production",
};
