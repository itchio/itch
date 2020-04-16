const $ = require("../common");
const { validateContext } = require("./context");

module.exports.build = async function build(cx) {
  validateContext(cx);
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
    $.say("Installing npm packages...");
    $(await $.sh("npm ci --production"));

    $.say("Building valet through electron-build-env...");
    let build = require("electron-build-env");
    let opts = {
      arch: cx.archInfo.electronArch,
    };
    $.say(`electron-build-env options: ${JSON.stringify(opts, null, 2)}`);
    await new Promise((resolve, reject) => {
      build(["../node_modules/.bin/neon", "build", "--release", "valet"], opts, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  });
}
