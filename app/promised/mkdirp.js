let Promise = require('bluebird')
let mkdirp = require('mkdirp')

module.exports = Promise.promisify(mkdirp)
