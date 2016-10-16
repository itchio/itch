
import os from './os'

module.exports = require(`./sandbox/${os.platform()}`)
