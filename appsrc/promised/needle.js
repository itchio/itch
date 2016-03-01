
const Promise = require('bluebird')
const needle = require('needle')

const app = require('../util/app')
const os = require('../util/os')

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.get_version('electron')} Chrome/${os.get_version('chrome')})`
})

module.exports = Promise.promisifyAll(needle)
