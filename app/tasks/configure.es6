
import os from '../util/os'

let log = require('../util/log')('tasks/configure')

import InstallStore from '../stores/install-store'
import AppActions from '../actions/app-actions'

let self = {
  configure: async function (app_path) {
    let platform = os.platform()

    switch (platform) {
      case 'win32':
      case 'darwin':
      case 'linux':
        return require(`./configurators/${platform}`).configure(app_path)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  },

  start: async function (opts) {
    let {id} = opts

    let app_path = InstallStore.app_path(id)
    log(opts, `configuring ${app_path}`)

    let {executables} = await self.configure(app_path)
    AppActions.install_update(id, {executables})
    return executables.length + ' candidates'
  }
}

export default self
