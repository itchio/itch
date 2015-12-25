

let Promise = require('bluebird')
let read_chunk = require('read-chunk')

module.exports = Promise.promisify(read_chunk)
