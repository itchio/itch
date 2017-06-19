
import env from "../env";

require("bluebird").config(env.name !== "production" ? {
  longStackTraces: true,
  warnings: true,
} : {});
