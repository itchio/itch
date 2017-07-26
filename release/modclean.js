const patterns = require("./modclean-patterns");
const path = require("path");
const glob = require("glob");
const rimraf = require("rimraf");

const cwd = process.cwd();
if (path.basename(cwd) !== "itch") {
  throw new Error(`Refusing to clean non-itch project: ${cwd}`);
}

const modulesDir = path.join(cwd, "node_modules");

const doGlob = (pattern) => glob.sync(pattern, {cwd: modulesDir, dot: true, nocase: true});

let killList = [];

const bigComboPattern = `**/@(${patterns.comboPatterns.join("|")})`
killList = [...killList, ...doGlob(bigComboPattern)]

for (const fullPattern of patterns.fullPatterns) {
  killList = [...killList, ...doGlob(fullPattern)]
}

console.log(`Removing ${killList.length} files & folders`);
for (const entry of killList) {
  const entryPath = path.join(modulesDir, entry);
  rimraf.sync(entryPath);
}
