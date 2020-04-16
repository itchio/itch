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

  $.say("Building valet")
  $(await $.sh(`npx electron-build-env --arch ${cx.archInfo.electronArch} -- neon build --release valet`));

  $.say("Copying valet to prefix");
  $(await $.sh("mkdir -p prefix/node_modules"));
  $(await $.sh("cp -rf node_modules/valet prefix/node_modules/"));
  $.say("Trimming down valet install");
  $(await $.sh("rm -rf prefix/node_modules/valet/{libbutler,native/target}"));

  $.say("Installing required externals")
  const externals = [
    // TODO: remove 'ws' once moved to IPC transport
    "ws",
    // TODO: is it really a good idea to ship that in production?
    "source-map-support",
  ];
  await $.cd("prefix", async function() {
    $(await $.sh(`npm install --no-save ${externals.join(" ")}`));
  });
}
