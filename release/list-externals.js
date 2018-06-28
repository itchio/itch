#!/usr/bin/env node

console.log(__filename.split(/[\/\\]/).slice(-3).join("/"));
process.exit(0);

const $ = require("./common");

async function main() {
  const ew = require("electron-webpack");
  $.say(`Configuring...`);
  const conf = await ew.getRendererConfiguration();
  $.say(`Renderer externals: `);
  for (const ext of conf.externals) {
    console.log(` - ${ext}`);
  }
}

main();
