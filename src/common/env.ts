const isDev = (app) => {
  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
};

const isCanary = (app) => app.getName() === "kitch";

const envName = (app) =>
  process.env.NODE_ENV || (isDev(app) ? "development" : "production");

const setNodeEnv = (app) => {
  process.env[["NODE", "ENV"].join("_")] = envName(app);
};

export default {
  isCanary,
  setNodeEnv,
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  channel: (app) => (isCanary(app) ? "canary" : "stable"),
  appName: (app) => (isCanary(app) ? "kitch" : "itch"),
  development: (app) => envName(app) === "development",
  production: (app) => envName(app) === "production",
};
