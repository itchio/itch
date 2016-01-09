
let Promise = require('bluebird')
let needle = require('needle')

let app
if (process.versions.electron) {
  app = require('electron').app
} else {
  app = { getVersion: () => '???' }
}
let os = require('../util/os')

needle.defaults({
  user_agent: `itch/${app.getVersion()} (${os.platform()}; Electron/${os.get_version('electron')} Chrome/${os.get_version('chrome')})`
})

module.exports = Promise.promisifyAll(needle)
