
const fs = require("fs");

const EXT_RE = /\.json$/;
const t1 = Date.now();

let contents = `
export const list = import("../../static/locales.json").then(x => x.default);

type LocaleStrings = { [id: string]: string };
type AllLocaleStrings = { [lang: string]: Promise<LocaleStrings> };

export const strings: AllLocaleStrings = {
`;

for (const file of fs.readdirSync("../../static/locales")) {
  if (EXT_RE.test(file)) {
    const name = file.replace(EXT_RE, "");
    let line = `  "${name}": import("../../static/locales/${file}").then(x => x.default as LocaleStrings),\n`;
    contents += line;
  }
}

contents += `};
`;

fs.writeFileSync("./index.ts", contents, {encoding: "utf-8"});
const t2 = Date.now();
console.log(`Generated ./index.ts in ${(t2-t1).toFixed()}ms`);
