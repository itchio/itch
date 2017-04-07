#!/usr/bin/env node

// generate latest documentation for itch using gitbook
// and deploy it to google cloud storage.

const $ = require('./common')

async function main () {
  await $.show_versions(['npm', 'node'])
  $(await $.npm_dep('gitbook', 'gitbook-cli'))

  await $.cd('docs', async function () {
    $(await $.npm('install'))
    $(await $.sh('gitbook build'))
    $(await $.gcp(`_book/* gs://docs.itch.ovh/itch/${$.build_ref_name()}`))
  });
}

main();
