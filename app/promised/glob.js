
let Promise = require('bluebird')

let glob = Promise.promisify(require('glob-electron'))

module. exports = glob
