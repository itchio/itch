import env from "common/env";
import { electron } from "renderer/bridge";

export default {
  ...env,
  setNodeEnv: () => env.setNodeEnv(electron.getApp()),
  isCanary: env.isCanary(electron.getApp()),
  channel: env.channel(electron.getApp()),
  appName: env.appName(electron.getApp()),
  development: env.development(electron.getApp()),
  production: env.production(electron.getApp()),
};
