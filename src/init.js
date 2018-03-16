const parcel = require("parcel-bundler");
const path = require("path");
const fs = require("fs");
const copy = require("recursive-copy");
const childProcess = require("child_process");
const logLevel = 3;

async function main() {
  console.log(`Bundling metal-side bundles...`);
  let metalEntryPoints = [
    "main.js",
    "inject/game.ts",
    "inject/itchio.ts",
    "inject/captcha.ts",
  ];
  let metalPromises = [];
  for (const metalEntryPoint of metalEntryPoints) {
    const metalFile = path.join(__dirname, metalEntryPoint);
    const metalOptions = { target: "electron", logLevel };
    const metalBundler = new parcel(metalFile, metalOptions);
    metalPromises.push(metalBundler.bundle());
  }
  await Promise.all(metalPromises);


  console.log(`Bundling chrome...`);
  const chromeFile = path.join(__dirname, "./index.html");
  const chromeOptions = { target: "electron", logLevel };
  const chromeBundler = new parcel(chromeFile, chromeOptions);
  await chromeBundler.serve();

  console.log(`Copying incidentals...`);
  await copy("src/static/", "dist/static/", {overwrite: true});

  let electronPath = `node_modules/.bin/electron`;
  if (process.platform === "win32") {
    electronPath = `node_modules\\.bin\\electron`;
  }
  const electronArgs = process.argv.slice(2);

  console.log(`Starting up ${electronPath} with args ${electronArgs.join(" ::: ")}`);
  const el = childProcess.spawn(electronPath, [
    ".",
    ...electronArgs,
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
