#!/usr/bin/env node

// compile javascript code and run unit tests

const $ = require('./common')

$.show_versions(['npm', 'gsutil'])

$($.npm_dep('grunt', 'grunt-cli'))
$($.npm_dep('coveralls', 'coveralls'))
$($.npm_dep('nyc', 'nyc'))
$($.npm('install'))

$($.npm('test'))
$($.npm('run coveralls'))
