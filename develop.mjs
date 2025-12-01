import * as esbuild from "esbuild";
import { spawn } from "child_process";
import fs from "fs";
import { mainConfig, rendererConfig } from "./esbuild.config.mjs";

async function main() {
  process.on("unhandledRejection", (e) => {
    console.error("Unhandled rejection:", e);
    process.exit(1);
  });
  process.on("uncaughtException", (e) => {
    console.error("Uncaught exception:", e);
    process.exit(1);
  });

  // Clean dist directories
  fs.rmSync("dist/main", { recursive: true, force: true });
  fs.rmSync("dist/renderer", { recursive: true, force: true });

  console.log("Building main process...");
  const mainCtx = await esbuild.context(mainConfig);
  const mainResult = await mainCtx.rebuild();
  if (mainResult.metafile) {
    fs.writeFileSync("dist/main/metafile.json", JSON.stringify(mainResult.metafile));
  }
  console.log("Main built!");

  console.log("Building renderer process...");
  const rendererCtx = await esbuild.context(rendererConfig);
  const rendererResult = await rendererCtx.rebuild();
  if (rendererResult.metafile) {
    fs.writeFileSync("dist/renderer/metafile.json", JSON.stringify(rendererResult.metafile));
  }

  // Copy HTML for development (no CSP)
  fs.copyFileSync("src/index.html", "dist/renderer/index.html");
  console.log("Renderer built!");

  // Start watch mode for both
  await mainCtx.watch();
  await rendererCtx.watch();
  console.log("Watching for changes...");

  // Start Electron
  const electronPath = (await import("electron")).default;
  const inspectArg = process.env.ITCH_BREAK === "1" ? "inspect-brk" : "inspect";

  const proc = spawn(electronPath, [".", `--${inspectArg}=9222`, "--color"], {
    stdio: ["ignore", "inherit", "inherit"],
  });

  console.log("Started Electron app...");

  proc.on("close", () => {
    console.log("App closed");
    mainCtx.dispose();
    rendererCtx.dispose();
    process.exit(0);
  });

  proc.on("error", (e) => {
    console.error("Failed to start Electron:", e);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
