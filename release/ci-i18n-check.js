#!/usr/bin/env node

// make sure that all used i18n strings exist,
// and that all defined i18n strings are used

const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));
const glob = bluebird.promisify(require("glob"));

async function main() {
  const localesContents = await fs.readFileAsync("appsrc/static/locales/en.json", {encoding: "utf8"});
  const strings = JSON.parse(localesContents);
  console.log("[info] en.json is valid json");

  let numberUndefined = 0;
  let numberUsed = 0;

  const inputFiles = await glob("appsrc/**/*.@(ts|tsx)");
  const used = {};

  await bluebird.map(inputFiles, async (inputFile) => {
    const contents = await fs.readFileAsync(inputFile, {encoding: "utf8"});
    // look for t("hello") or t("hello", ...)
    const re = /[^a-zA-Z]t\(\"([a-z_\.]+)\"(\)|,)/g;
    let matches;
    while (matches = re.exec(contents)) {
      numberUsed++;
      const key = matches[1];
      used[key] = true;
      if (!strings[key]) {
        console.log(`[oops] ${key} is undefined.`);
        numberUndefined++;
      }
    }
  });

  let numberUnused = 0;
  for (const key of Object.keys(strings)) {
    if (!used[key]) {
      numberUnused++;
    }
  }
  console.log(`[info] ${numberUnused} defined strings are unused as literals`);

  if (numberUndefined > 0) {
    console.log(`[oops] ${numberUndefined} used strings are undefined`);
    process.exit(1);
  } else {
    console.log(`[info] all ${numberUsed} used strings are defined`);
  }
}

main();
