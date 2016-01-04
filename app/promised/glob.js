
let Promise = require('bluebird')

let glob = Promise.promisify(require('glob'))

module.exports = glob
