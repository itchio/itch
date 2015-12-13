'use strict'

let rimraf = require('rimraf')
let Promise = require('bluebird')

module.exports = Promise.promisify(rimraf)
