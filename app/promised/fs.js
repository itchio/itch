'use nodent';'use strict'

let Promise = require('bluebird')

let fs = Promise.promisifyAll(require('fs'))

module.exports = fs
