#!/usr/bin/env node

// compile itch for production environemnts

const $ = require('./common')
const bluebird = require('bluebird');
const humanize = require('humanize-plus');

async function main () {
  $.say(`Preparing to compile ${$.appName()} ${$.buildVersion()}`);

  await $.showVersions(['npm', 'node']);

  $(await $.npm('install'));

  $.say('Wiping dist...');
  $(await $.sh('rm -rf dist'));

  $.say('Compiling sources...');
  $(await $.sh('npm run -s build-metal-prod'))
  $(await $.sh('npm run -s build-chrome-prod'))

  $.say('Generating custom package.json...')
  const pkg = JSON.parse(await $.readFile('package.json'));
  for (const field of ['name', 'productName', 'desktopName']) {
    pkg[field] = $.appName();
  }
  pkg.version = $.buildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await $.writeFile(`dist/package.json`, pkgContents);

  $.say('Compressing dist...')
  $(await $.sh('tar cf dist.tar dist'))

  const stats = await $.lstat('dist.tar');
  $.say(`dist.tar is ${humanize.fileSize(stats.size)}`)
}

main();
