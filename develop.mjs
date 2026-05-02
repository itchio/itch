import * as esbuild from "esbuild";
import { spawn, execSync } from "child_process";
import fs from "fs";
import { mainConfig, rendererConfig } from "./esbuild.config.mjs";

// Electron/Chromium on Linux can leave the TTY in raw mode after an abrupt SIGINT.
// `</dev/tty` is required so stty can find the terminal regardless of our stdio.
const restoreTty = () => {
  if (!process.stdin.isTTY) return;
  try { execSync("stty sane </dev/tty", { stdio: "ignore" }); } catch {}
};
process.on("exit", restoreTty);

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
  const chromeDevToolsPort = process.env.ITCH_CHROME_DEVTOOLS_PORT || "9223";

  const proc = spawn(electronPath, [".", `--${inspectArg}=9222`, "--color"], {
    env: {
      ...process.env,
      ITCH_CHROME_DEVTOOLS_PORT: chromeDevToolsPort,
    },
    stdio: ["ignore", "inherit", "inherit"],
  });

  console.log("Started Electron app...");

  // Catch SIGINT so we wait for Electron to fully exit before tearing down —
  // otherwise Node exits first and Electron re-mangles the TTY on its way out.
  // A second Ctrl+C bails immediately.
  let interrupted = false;
  process.on("SIGINT", () => {
    if (interrupted) {
      restoreTty();
      process.exit(130);
    }
    interrupted = true;
    proc.kill("SIGINT");
  });

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
