#!/usr/bin/env node

const patterns = require("./modclean-patterns");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const rimraf = require("rimraf");

if (process.argv.length < 2) {
  throw new Error(`Usage: modclean.js DIR`);
}
const workingDir = path.resolve(process.argv[process.argv.length - 1]);
const modulesDir = path.join(workingDir, "node_modules");
console.log(`Cleaning module dir: ${modulesDir}`);
try {
  let stats = fs.statSync(modulesDir);
} catch (e) {
  console.log(`Could not stat module dir: ${e.message}`);
  process.exit(1);
}

const doGlob = pattern =>
  glob.sync(pattern, { cwd: modulesDir, dot: true, nocase: true });

let killList = [];

const bigComboPattern = `**/@(${patterns.comboPatterns.join("|")})`;
killList = [...killList, ...doGlob(bigComboPattern)];

for (const fullPattern of patterns.fullPatterns) {
  killList = [...killList, ...doGlob(fullPattern)];
}

console.log(`Removing ${killList.length} files & folders`);
for (const entry of killList) {
  const entryPath = path.join(modulesDir, entry);
  rimraf.sync(entryPath);
}
