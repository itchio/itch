const parcel = require("parcel-bundler");
const path = require("path");
const fs = require("fs");
const copy = require("recursive-copy");
const childProcess = require("child_process");
const logLevel = 2;

async function main() {
  console.log(`Bundling metal...`);
  const metalFile = path.join(__dirname, "./metal.ts");
  const metalOptions = { target: "electron", logLevel };
  const metalBundler = new parcel(metalFile, metalOptions);
  await metalBundler.bundle();

  console.log(`Bundling chrome...`);
  const chromeFile = path.join(__dirname, "./index.html");
  const chromeOptions = { target: "electron", logLevel };
  const chromeBundler = new parcel(chromeFile, chromeOptions);
  await chromeBundler.serve();

  console.log(`Copying incidentals...`);
  await copy("src/main.js", "dist/main.js", {overwrite: true});
  await copy("src/static/", "dist/static/", {overwrite: true});

  console.log(`Starting up electron!`);
  const el = childProcess.spawn(`node_modules\\.bin\\electron.cmd`, [
    "."
  ], {
    stdio: "inherit",
  });
  el.on("error", (e) => {
    console.log(`Electron process error:\n${e.stack}`);
    process.exit(1);
  });

  el.on("close", () => {
    console.log(`Electron returned!`);
    process.exit(0);
  });
}

main().catch((e) => {
  console.log(`Fatal error:\n${e.stack}`);
  process.exit(1);
});
