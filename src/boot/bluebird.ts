
import env from "../env";

require("bluebird").config(env.name === "development" ? {
  longStackTraces: true,
  warnings: true,
} : {});
