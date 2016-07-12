#!/usr/bin/env node

// compile javascript code and run unit tests

const $ = require('./common')

$.show_versions(['npm', 'gsutil'])

$($.npm('install'))
$($.npm('install grunt-cli coveralls nyc'))

$($.npm('test'))
$($.npm('run coveralls'))
