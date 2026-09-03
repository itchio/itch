// Runs the unit tests (src/**/*.test.ts) with node:test.
//
// The sources import through the tsconfig path aliases (main/..., common/...)
// without file extensions, which Node can't resolve on its own. Each test
// file is bundled with the same esbuild config as the main process first,
// then the bundles run under `node --test`.
import * as esbuild from "esbuild";
import { spawnSync } from "child_process";
import { readdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mainConfig } from "./esbuild.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.join(__dirname, ".cache", "unit-tests");

function findFiles(dir, pattern) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findFiles(full, pattern));
    } else if (pattern.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

const tests = findFiles(path.join(__dirname, "src"), /\.test\.tsx?$/);
if (tests.length === 0) {
  console.error("no unit tests found under src/");
  process.exit(1);
}

rmSync(outdir, { recursive: true, force: true });
await esbuild.build({
  ...mainConfig,
  entryPoints: tests,
  outdir,
  outbase: path.join(__dirname, "src"),
  outExtension: { ".js": ".cjs" },
  sourcemap: "inline",
  minify: false,
  metafile: false,
  // tests run under plain node: node:test and other builtins stay external
  external: [...mainConfig.external, "node:*"],
});

const bundles = findFiles(outdir, /\.cjs$/);
const result = spawnSync(
  process.execPath,
  ["--test", "--enable-source-maps", ...process.argv.slice(2), ...bundles],
  { stdio: "inherit" }
);
process.exit(result.status ?? 1);
