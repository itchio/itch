#!/usr/bin/env node

// lint javascript code and run unit tests

const $ = require('./common')

$.show_versions(['npm', 'node'])
$($.npm_dep('grunt', 'grunt-cli'))

$($.npm('run lint'))
