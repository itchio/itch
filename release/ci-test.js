#!/usr/bin/env node

// compile javascript code and run unit tests

const $ = require('./common')

$.show_versions(['npm', 'gsutil'])

$($.npm('install'))
$($.npm_dep('grunt', 'grunt-cli'))
$($.npm_dep('coveralls', 'coveralls'))
$($.npm_dep('nyc', 'nyc'))

$($.npm('test'))
$($.npm('run coveralls'))
