const $ = require("../common");

module.exports.build = async function build() {
  $.say(`Building ${$.appName()} ${$.buildVersion()}`);

  $.say("Wiping prefix/");
  $(await $.sh("rm -rf prefix"));
  $(await $.sh("mkdir -p prefix"));

  $.say("Compiling sources");
  $(await $.sh("npm run compile"));

  $.say("Copying dist files to prefix/");
  $(await $.sh("cp electron-index.js prefix/"));
  $(await $.sh("mkdir -p prefix/dist"));
  $(await $.sh("cp -rf dist/production prefix/dist/"));

  $.say("Generating custom package.json");
  const pkg = JSON.parse(await $.readFile("package.json"));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = $.appName();
  }
  delete pkg.scripts.postinstall;
  pkg.version = $.buildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await $.writeFile(`prefix/package.json`, pkgContents);

  $.say("Copying package-lock.json to prefix/");
  $(await $.sh("cp package-lock.json prefix/"));

  $.say("Installing npm packages in prefix")
  await $.cd("prefix", async () => {
    $(await $.sh("npm ci --production"));
  });
}