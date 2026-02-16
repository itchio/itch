import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

// Path aliases matching tsconfig paths (baseUrl: src)
const aliases = {
  common: path.resolve(__dirname, "src/common"),
  renderer: path.resolve(__dirname, "src/renderer"),
  main: path.resolve(__dirname, "src/main"),
  vendor: path.resolve(__dirname, "src/vendor"),
  static: path.resolve(__dirname, "src/static"),
};

// Main process config
export const mainConfig = {
  entryPoints: {
    main: "src/main/index.ts",
    "inject-game": "src/main/inject/inject-game.ts",
    "inject-captcha": "src/main/inject/inject-captcha.ts",
    "inject-preload": "src/main/inject/inject-preload.ts",
  },
  bundle: true,
  platform: "node",
  target: "node24",
  outdir: "dist/main",
  // NOTE: Electron supports ESM for main process. Migrating from CJS to ESM is an optional follow-up.
  outExtension: { ".js": ".bundle.cjs" },
  format: "cjs",
  sourcemap: true,
  minify: isProduction,
  metafile: true,
  external: ["electron", "original-fs"],
  alias: aliases,
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isProduction ? "production" : "development"
    ),
  },
};

// Browser polyfills for Node.js built-ins
const browserAliases = {
  ...aliases,
  querystring: "querystring-es3",
  events: "events",
  url: "url",
};

// Renderer process config
export const rendererConfig = {
  entryPoints: {
    renderer: "src/renderer/index.tsx",
  },
  bundle: true,
  platform: "browser",
  target: "chrome144", // Match Electron 40's Chromium version
  outdir: "dist/renderer",
  outExtension: { ".js": ".bundle.js" },
  format: "iife",
  globalName: "LIB",
  sourcemap: true,
  minify: isProduction,
  metafile: true,
  external: ["systeminformation"],
  alias: browserAliases,
  loader: {
    ".png": "file",
    ".svg": "file",
    ".woff": "file",
    ".woff2": "file",
    ".ttf": "file",
    ".css": "css",
  },
  assetNames: "[name]-[hash]",
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isProduction ? "production" : "development"
    ),
    global: "window",
  },
  inject: ["./esbuild-shims.js"],
};
