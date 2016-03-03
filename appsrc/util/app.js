
import os from './os'
import env from '../env'

let app
if (env.name === 'test') {
  app = {
    getVersion: () => 'test-version',
    getPath: (p) => `tmp/${p}`
  }
} else {
  const electron = require('electron')
  app = os.in_browser() ? electron.app : electron.remote.app
}

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

export default self
