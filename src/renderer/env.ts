import env from "common/env";
import { electron } from "renderer/bridge";

export default {
  ...env,
  setNodeEnv: () => env.setNodeEnv(electron.app),
  isCanary: env.isCanary(electron.app),
  channel: env.channel(electron.app),
  appName: env.appName(electron.app),
  development: env.development(electron.app),
  production: env.production(electron.app),
};
