#!/usr/bin/env node

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
