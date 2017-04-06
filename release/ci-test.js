#!/usr/bin/env node

// compile typescript code and run unit tests

const $ = require('./common')

$.show_versions(['npm'])

$($.npm('install'))
$($.npm('webpack --profile --config webpack.config.tests.js'))

process.env.ELECTRON_ENABLE_LOGGING = '1';

if (process.platform === "linux") {
  $($.npm('run run-tests-xvfb'))
} else {
  $($.npm('run run-tests'))
}

