
import Promise from 'bluebird'
import os from '../util/os'

let log = require('../util/log')('tasks/configure')

import InstallStore from '../stores/install-store'

function configure (app_path) {
  console.log(`Configuring app at '${app_path}'`)
  let platform = os.platform()

  switch (platform) {
    case 'darwin':
    case 'win32':
    case 'linux':
      return require(`./configurators/${platform}`).configure(app_path)
    default:
      return Promise.reject(`Unsupported platform: ${platform}`)
  }
}

function start (opts) {
  let {id} = opts

  let app_path = InstallStore.app_path(id)
  log(opts, `configuring ${app_path}`)
  return configure(app_path).then((res) => {
    let {executables} = res
    return InstallStore.update_install(id, {executables})
  })
}

export default { start }
