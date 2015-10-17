
import Promise from 'bluebird'

import os from '../util/os'

let log = require('../util/log')('tasks/configure')

import InstallStore from '../stores/install-store'
import AppActions from '../actions/app-actions'

let self = {
  configure: function (app_path) {
    let platform = os.platform()

    switch (platform) {
      case 'win32':
      case 'darwin':
      case 'linux':
        return require(`./configurators/${platform}`).configure(app_path)
      default:
        return Promise.reject(`Unsupported platform: ${platform}`)
    }
  },

  start: function (opts) {
    let {id} = opts

    let app_path = InstallStore.app_path(id)
    log(opts, `configuring ${app_path}`)
    return self.configure(app_path).then((res) => {
      let {executables} = res
      return AppActions.install_update(id, {executables})
    })
  }
}

export default self
