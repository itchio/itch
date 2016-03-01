
const os = require('./os')
const electron = require('electron')

let app = os.in_browser() ? electron.app : electron.remote.app

// preload all values at loadtime to avoid doing sync RPC (via remote) at runtime
let version = app.getVersion()
let paths = {}
for (let name of ['home', 'appData', 'userData', 'temp', 'exe', 'desktop', 'documents', 'downloads', 'music', 'pictures', 'videos']) {
  paths[name] = app.getPath(name)
}

let self = {
  getVersion: () => version,
  getPath: (name) => {
    if (!(name in paths)) {
      throw new Error(`invalid path: ${name}`)
    }
    return paths[name]
  }
}

module.exports = self
