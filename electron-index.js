let envName = "production";

if (process.argv.indexOf("--dev") != -1) {
  envName = "development";
}
process.env.NODE_ENV = envName;

require(`./lib/${envName}/main`);
