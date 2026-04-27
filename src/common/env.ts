interface AppLike {
  getName(): string;
  isPackaged: boolean;
}

const isDev = (app: AppLike) => {
  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = Number.parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
};

const isCanary = (app: AppLike) => app.getName() === "kitch";

const envName = (app: AppLike) =>
  process.env.NODE_ENV || (isDev(app) ? "development" : "production");

const setNodeEnv = (app: AppLike) => {
  process.env[["NODE", "ENV"].join("_")] = envName(app);
};

export default {
  isCanary,
  setNodeEnv,
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  channel: (app: AppLike) => (isCanary(app) ? "canary" : "stable"),
  appName: (app: AppLike) => (isCanary(app) ? "kitch" : "itch"),
  development: (app: AppLike) => envName(app) === "development",
  production: (app: AppLike) => envName(app) === "production",
};
