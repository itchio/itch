#!/usr/bin/env node

// make sure that all used i18n strings exist,
// and that all defined i18n strings are used

const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));
const glob = bluebird.promisify(require("glob"));

const printUnused = false;

async function main() {
  const localesContents = await fs.readFileAsync("src/static/locales/en.json", {
    encoding: "utf8",
  });
  const strings = JSON.parse(localesContents);
  console.log("[info] en.json is valid json");

  let numberStrings = 0;
  let numberUsed = 0;
  let numberUnused = 0;
  let numberUndefined = 0;
  let undefinedStrings = [];

  const inputFiles = await glob("src/**/*.@(ts|tsx)");
  console.log(`[info] found ${inputFiles.length} source files`);
  const used = {};

  await bluebird.map(inputFiles, async inputFile => {
    const contents = await fs.readFileAsync(inputFile, { encoding: "utf8" });
    // look for t("hello") or t("hello", ...), or T or TString
    const regularExpressions = [
      /={\s*\[\s*"([^"]*)"[^\]]*\]}/g,
      /{TString\(\s*\[\s*"([^"]*)"[^\]]*\]\)/g,
      /{T\(\s*\[\s*"([^"]*)"[^\]]*\]\)/g,
      /{t\([^,]+,\s*\[\s*"([^"]*)"[^\]]*\]\)/g,
    ];

    for (const re of regularExpressions) {
      let matches;
      while ((matches = re.exec(contents))) {
        numberUsed++;
        const key = matches[1];
        used[key] = true;
        if (!strings[key]) {
          undefinedStrings.push({inputFile, key});
          numberUndefined++;
        }
      }
    }
  });

  if (printUnused) {
    console.log(`[info] Used strings: `);
    for (const usedKey of Object.keys(used)) {
      console.log(` + ${usedKey}`);
    }
    console.log(`[info] Unused strings: `)
    for (const key of Object.keys(strings)) {
      if (used[key]) {
        continue;
      }
      console.log(` - ${key}`);
    }
  }
  
  for (const key of Object.keys(strings)) {
    numberStrings++;
    if (used[key]) {
      numberUsed++;
    } else {
      numberUnused++;
    }
  }
  console.log(`[info] ${numberStrings} strings, ${numberUsed} used, ${numberUnused} unused as literals`);

  if (numberUndefined > 0) {
    console.log(`[oops] ${numberUndefined} used strings are undefined`);
    console.log(`----------------------`);
    console.log(`Here's a list of undefined strings:`);
    for (const undef of undefinedStrings) {
      console.log(` - "${undef.key}"`);
      console.log(`   in (${undef.inputFile})`);
    }
    console.log(`----------------------`);
    console.log(`Exiting with status 1`);
    process.exit(1);
  } else {
    console.log(`[info] all used strings are defined`);
  }
}

main();
