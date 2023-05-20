import env from "common/env";
import { app } from "electron";

export default {
  ...env,
  setNodeEnv: () => env.setNodeEnv(app),
  isCanary: env.isCanary(app),
  channel: env.channel(app),
  appName: env.appName(app),
  development: env.development(app),
  production: env.production(app),
};
