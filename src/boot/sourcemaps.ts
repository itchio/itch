
import * as sourcemaps from "source-map-support";
import env from "../env";

if (env.name === "development") {
  sourcemaps.install({
    hookRequire: true,
  });
}
