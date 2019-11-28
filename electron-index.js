
let envName = "production";

if (process.argv.indexOf("--dev") != -1) {
  envName = "development";
}

require(`./dist/${envName}/main/assets/main.bundle`);
