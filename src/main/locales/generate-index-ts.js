//@ts-check
"use strict";

const fs = require("fs");

const EXT_RE = /\.json$/;
const t1 = Date.now();

let contents = `
export const list = require("static/locales.json");

type LocaleStrings = { [id: string]: string };
type AllLocaleStrings = { [lang: string]: LocaleStrings };

export const strings: AllLocaleStrings = {
`;

for (const file of fs.readdirSync("../../static/locales")) {
  if (EXT_RE.test(file)) {
    const name = file.replace(EXT_RE, "");
    let line = `  "${name}": require("static/locales/${file}") as LocaleStrings,\n`;
    contents += line;
  }
}

contents += `};
`;

fs.writeFileSync("./index.ts", contents, { encoding: "utf-8" });
const t2 = Date.now();
console.log(`Generated ./index.ts in ${(t2 - t1).toFixed()}ms`);
