#!/usr/bin/env node

// compile itch for production environemnts

const $ = require('./common')
const bluebird = require('bluebird');
const humanize = require('humanize-plus');

async function main () {
  $.say(`Preparing to compile ${$.app_name()}`);

  await $.show_versions(['npm', 'node']);

  $(await $.npm('install'));

  $.say('Compiling sources...');
  const js_outputs = await bluebird.all([
    $.get_output('npm run -s build-metal-prod'),
    $.get_output('npm run -s build-chrome-prod')
  ]);

  $.say('Sources compilation output:');
  $.putln('-------- Metal -------:\n' + js_outputs[0]);
  $.putln('------- Chrome -------:\n' + js_outputs[1]);

  $.say('Generating custom package.json...')
  const pkg = JSON.parse(await $.read_file('package.json'));
  for (const field of ['name', 'productName', 'desktopName']) {
    pkg[field] = $.app_name();
  }
  const pkg_contents = JSON.stringify(pkg, null, 2);
  await $.write_file(`dist/package.json`, pkg_contents);

  $.say('Compressing dist...')
  $(await $.sh('tar cf dist.tar dist'))

  const stats = await $.lstat('dist.tar');
  $.say(`dist.tar is ${humanize.fileSize(stats.size)}`)
}

main();
