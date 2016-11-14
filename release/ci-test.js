#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

$.show_versions(['npm', 'gsutil'])

$($.npm('install'))
$($.npm('install grunt-cli nyc'))

$($.npm('test'))
$($.npm('run codecov'))
