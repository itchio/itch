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
  pkg.version = $.buildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await $.writeFile(`prefix/package.json`, pkgContents);

  $.say("Downloading valet binaries")
  let valetArch = cx.archInfo.electronArch === "ia32" ? "i686" : "x86_64";
  let otherValetArch = valetArch == "i686" ? "x86_64" : "i686";
  await $.cd("node_modules/@itchio/valet", async function () {
    $(await $.sh(`npm run postinstall -- --verbose --arch ${valetArch}`));
  });

  $.say("Copying valet to prefix");
  $(await $.sh("mkdir -p prefix/node_modules/@itchio"));
  $(await $.sh("cp -rf node_modules/@itchio/valet prefix/node_modules/@itchio"));
  $.say("Trimming down valet install");
  $(await $.sh(`rm -rf prefix/node_modules/@itchio/valet/artifacts/${otherValetArch}-*`));

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
