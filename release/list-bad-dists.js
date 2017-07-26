
const fs = require("fs");
const path = require("path");

const base = "node_modules";
const dirs = fs.readdirSync(base);

const knownBadDists = [
  "react",
  "react-dom",
]

let bads = [];

for (const dir of dirs) {
  if (knownBadDists.indexOf(dir) !== -1) {
    bads.push(dir);
    continue;
  }

  let hasDist = false;
  try {
    fs.readdirSync(path.join(base, dir, "dist"));
    hasDist = true;
  } catch (e) {
    // muffin
  }

  if (!hasDist) {
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(base, dir, "package.json")));
  if (!pkg.main) {
    continue;
  }

  const main = path.normalize(pkg.main);

  const mainDir = path.dirname(main);
  let isBad = false;
  if (mainDir === ".") {
    // could be dist, we don't know
  } else if (!/^dist/.test(mainDir)) {
    // ahAH!
    bads.push(dir);
  }
}

const excludes = bads.map((dir) => `${dir}/dist`);
console.log(JSON.stringify(excludes, null, 2));