const isDev = () => require("electron-is-dev");
import { app, remote } from "electron";

let realApp = app || (remote && remote.app) || { name: "itch" };
const isCanary = realApp.name === "kitch";

const envName =
  process.env.NODE_ENV || (isDev() ? "development" : "production");
process.env[["NODE", "ENV"].join("_")] = envName;

export default {
  isCanary,
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  name: envName,
  development: envName === "development",
  production: envName === "production",
};
