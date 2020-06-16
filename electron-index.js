let envName = "production";

if (process.argv.indexOf("--dev") != -1) {
  envName = "development";
} else {
  process.env.NODE_ENV = "production";
  process.env.NODE_PATH = require("electron").app.getAppPath();
}

require(`./lib/${envName}/main`);
