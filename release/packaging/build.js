//@ts-check

import { readFileSync, writeFileSync } from "fs";
import { $, header } from "@itchio/bob";
import { getAppName, getBuildVersion, measure } from "../common.js";

/**
 * @param {import("./context.js").Context} cx
 */
export async function build(cx) {
  header("Transpiling and bundling TypeScript, CSS, etc.");

  console.log("Wiping prefix/");
  $("rm -rf prefix");
  $("mkdir -p prefix");

  console.log("Compiling sources");
  await measure("esbuild bundle", async () => {
    $("npm run compile");
  });

  console.log("Copying dist files to prefix/");
  $("cp -rf dist prefix/");

  console.log("Copying static resources to prefix...")
  $("mkdir prefix/src");
  $("cp -rf src/static prefix/src");

  console.log("Generating custom package.json");
  const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf-8" }));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = getAppName();
  }
  pkg.version = getBuildVersion();
  delete pkg.dependencies;
  delete pkg.devDependencies;
  const pkgContents = JSON.stringify(pkg, null, 2);
  writeFileSync(`prefix/package.json`, pkgContents, { encoding: "utf-8" });
}
