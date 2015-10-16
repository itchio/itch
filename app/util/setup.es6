
import app from 'app'
import path from 'path'
import fstream from 'fstream'

import http from './http'
import noop from './noop'
import os from './os'

// TODO: turn into a store!
let self = {
  path_done: false,

  augment_path: function () {
    let bin_path = path.join(app.getPath('userData'), 'bin')
    if (!self.path_done) {
      self.path_done = true
      process.env.PATH += `${path.delimiter}${bin_path}`
    }
    return bin_path
  },

  binary_url: function () {
    let prefix = 'https://cdn.rawgit.com/itchio/7za-binaries/v9.20/'
    let file

    switch (os.platform()) {
      case 'win32':
        file = '7za.exe'
        break
      case 'darwin':
        file = '7za'
        break
      default:
        throw new Error('7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)')
    }
    let url = `${prefix}${file}`
    return {url, file}
  },

  run: function (opts) {
    let {onstatus = noop} = opts

    let bin_path = self.augment_path()

    onstatus('Checking for 7-zip')
    return os.check_presence('7za').catch(() => {
      onstatus('Downloading 7-zip...', 'download')

      let {url, file} = self.binary_url()
      let target_path = path.join(bin_path, file)
      let sink = fstream.Writer({path: target_path, mode: 0o777})
      return http.request({ url, sink })
    })
  }
}

export default self
