

let Promise = require('bluebird')
let needle = require('needle')

let app = require('electron').app
let os = require('../util/os')

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.get_version('electron')} Chrome/${os.get_version('chrome')})`
})

module.exports = Promise.promisifyAll(needle)
