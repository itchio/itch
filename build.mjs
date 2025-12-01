import * as esbuild from "esbuild";
import fs from "fs";

process.env.NODE_ENV ||= "production";

import { mainConfig, rendererConfig } from "./esbuild.config.mjs";

// Clean dist directories
fs.rmSync("dist/main", { recursive: true, force: true });
fs.rmSync("dist/renderer", { recursive: true, force: true });

// Build main process
console.log("Building main process...");
await esbuild.build(mainConfig);
console.log("Main built!");

// Build renderer process
console.log("Building renderer process...");
await esbuild.build(rendererConfig);
console.log("Renderer built!");

// Copy and process HTML
const html = fs.readFileSync("src/index.html", "utf8");
const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' http://127.0.0.1:* https://dale.itch.ovh https://dale.itch.zone; style-src 'unsafe-inline'; img-src 'self' https://img.itch.zone https://weblate.itch.ovh https://weblate.itch.zone">`;
const processedHtml = html.replace("</head>", `  ${csp}\n</head>`);
fs.writeFileSync("dist/renderer/index.html", processedHtml);

console.log("Build complete!");
