import { app, remote } from "electron";
import { envSettings } from "main/constants/env-settings";

let realApp = app || (remote && remote.app) || { name: "itch" };
const isCanary = realApp.name === "kitch";
const isProduction = process.env.NODE_ENV === "production";
const envName = isProduction ? "production" : "development";

export default {
  isCanary,
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: envSettings.integrationTests,
  unitTests: false,
  name: envName,
  development: envName === "development",
  production: envName === "production",
};
