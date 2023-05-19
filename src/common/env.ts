import { app, remote } from "electron";

const appIsDev = (app) => {
  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
};

let realApp = app || (remote && remote.app) || { getName: () => "itch" };

const isDev = appIsDev(realApp);

const isCanary = realApp.getName() === "kitch";

const envName = process.env.NODE_ENV || (isDev ? "development" : "production");
process.env[["NODE", "ENV"].join("_")] = envName;

export default {
  isCanary,
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  development: envName === "development",
  production: envName === "production",
};
