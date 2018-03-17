const parcel = require("parcel-bundler");
const path = require("path");
const fs = require("fs");
const copy = require("recursive-copy");
const childProcess = require("child_process");
const logLevel = 3;
let outDir = "./app";

const testing = process.env.NODE_ENV === "test";
const production = process.env.NODE_ENV === "production";
const development = !testing && !production;
const watch = development;

if (production) {
  outDir = "./dist/app";
}

let publicUrl = undefined;
if (!development) {
  publicUrl = "./";
}

async function main() {
  console.log(`Bundling metal-side bundles...`);
  let metalEntryPoints = [
    "main.js",
  ];
  for (const metalEntryPoint of metalEntryPoints) {
    const metalFile = path.join(__dirname, metalEntryPoint);
    const metalOptions = { target: "electron", logLevel, watch, outDir };
    const metalBundler = new parcel(metalFile, metalOptions);
    await metalBundler.bundle();
  }

  let injectEntryPoints = [
    "inject/inject-game.ts",
    "inject/inject-itchio.ts",
    "inject/inject-captcha.ts",
  ];
  for (const injectEntryPoint of injectEntryPoints) {
    const injectFile = path.join(__dirname, injectEntryPoint);
    const injectOptions = { target: "electron", logLevel, watch: false, outDir };
    const injectBundler = new parcel(injectFile, injectOptions);
    await injectBundler.bundle();
  }

  console.log(`Bundling chrome...`);
  const chromeFile = path.join(__dirname, "./index.html");
  const chromeOptions = { target: "electron", logLevel, watch, outDir, publicUrl };
  const chromeBundler = new parcel(chromeFile, chromeOptions);
  if (watch) {
    await chromeBundler.serve();
  } else {
    await chromeBundler.bundle();
  }

  console.log(`Copying assets...`);
  for (const staticName of ["locales", "locales.json", "images"]) {
    await copy(`src/static/${staticName}`, path.join(outDir, `static/${staticName}`), {
      overwrite: true
    });
  }

  if (development) {
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
  } else {
    console.log(`All done!`);
    process.exit(0);
  }
}

main().catch((e) => {
  console.log(`Fatal error:\n${e.stack}`);
  process.exit(1);
});
