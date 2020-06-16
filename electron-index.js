let envName = "production";

if (process.argv.indexOf("--dev") != -1) {
  envName = "development";
}

require(`./lib/${envName}/main`);
