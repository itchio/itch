//@ts-check

import { makeUniversalApp } from "@electron/universal";
import { getAppName } from "./common.js";
import ospath from "path";
import fs from "fs";
import { chalk } from "@itchio/bob";

async function main() {
  const appName = getAppName();
  const projectDir = process.cwd();

  const x64App = ospath.join(projectDir, "artifacts", "darwin-amd64", `${appName}.app`);
  const arm64App = ospath.join(projectDir, "artifacts", "darwin-arm64", `${appName}.app`);
  const universalDir = ospath.join(projectDir, "artifacts", "darwin-universal");
  const universalApp = ospath.join(universalDir, `${appName}.app`);

  console.log(`| Creating universal binary for ${chalk.green(appName)}`);
  console.log(`| x64 app: ${chalk.blue(x64App)}`);
  console.log(`| arm64 app: ${chalk.blue(arm64App)}`);
  console.log(`| output: ${chalk.blue(universalApp)}`);

  if (!fs.existsSync(x64App)) {
    throw new Error(`x64 app not found at ${x64App}`);
  }
  if (!fs.existsSync(arm64App)) {
    throw new Error(`arm64 app not found at ${arm64App}`);
  }

  // Clean up any existing universal output
  if (fs.existsSync(universalDir)) {
    fs.rmSync(universalDir, { recursive: true });
  }
  fs.mkdirSync(universalDir, { recursive: true });

  console.log(`| Merging apps into universal binary...`);

  await makeUniversalApp({
    x64AppPath: x64App,
    arm64AppPath: arm64App,
    outAppPath: universalApp,
  });

  console.log(`| ${chalk.green("Universal binary created successfully!")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
