#!/usr/bin/env node

const $ = require("./common");

async function main() {
  const ew = require("electron-webpack");
  const rconf = await ew.getRendererConfiguration();
  $.say(`Renderer externals: `);
  for (const ext of rconf.externals) {
    console.log(` - ${ext}`);
  }

  const mconf = await ew.getMainConfiguration();
  $.say(`Main externals: `);
  for (const ext of mconf.externals) {
    console.log(` - ${ext}`);
  }
}

main();
