import * as esbuild from "esbuild";
import fs from "fs";

import { mainConfig, rendererConfig } from "./esbuild.config.mjs";

// Disable metafile for tagged release builds
const isReleaseBuild = !!process.env.CI_COMMIT_TAG;
if (isReleaseBuild) {
  mainConfig.metafile = false;
  rendererConfig.metafile = false;
}

// Clean dist directories
fs.rmSync("dist/main", { recursive: true, force: true });
fs.rmSync("dist/renderer", { recursive: true, force: true });

// Build main process
console.log("Building main process...");
const mainResult = await esbuild.build(mainConfig);
if (mainResult.metafile) {
  fs.writeFileSync("dist/main/metafile.json", JSON.stringify(mainResult.metafile));
}
console.log("Main built!");

// Build renderer process
console.log("Building renderer process...");
const rendererResult = await esbuild.build(rendererConfig);
if (rendererResult.metafile) {
  fs.writeFileSync("dist/renderer/metafile.json", JSON.stringify(rendererResult.metafile));
}
console.log("Renderer built!");

// Copy and process HTML
const html = fs.readFileSync("src/index.html", "utf8");
const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' http://127.0.0.1:* https://dale.itch.zone; style-src 'unsafe-inline'; img-src 'self' https://img.itch.zone https://weblate.itch.zone">`;
const processedHtml = html.replace("</head>", `  ${csp}\n</head>`);
fs.writeFileSync("dist/renderer/index.html", processedHtml);

console.log("Build complete!");
