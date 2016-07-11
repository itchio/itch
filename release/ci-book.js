#!/usr/bin/env node

// generate latest documentation for itch using gitbook
// and deploy it to google cloud storage.

const $ = require('./common')

$.show_versions(['npm', 'node'])
$($.npm_dep('gitbook', 'gitbook-cli'))

$.cd('docs', function () {
  $($.npm('install'))
  $($.sh('gitbook build'))
  $($.gcp(`_book/* gs://docs.itch.ovh/itch/${$.build_ref_name()}`))
})
