
import Promise from 'bluebird'

import omv from 'mv'
module.exports = Promise.promisify(omv)
