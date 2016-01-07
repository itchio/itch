
let os = require('../util/os')

import {some, values} from 'underline'

let log = require('../util/log')('tasks/configure')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

let html = require('./configure/html')

let self = {
  configure: async function (app_path) {
    let platform = os.platform()

    switch (platform) {
      case 'win32':
      case 'darwin':
      case 'linux':
        return require(`./configure/${platform}`).configure(app_path)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  },

  start: async function (opts) {
    let id = opts.id

    let cave = await CaveStore.find(id)

    let app_path = CaveStore.app_path(cave.install_location, id)
    log(opts, `configuring ${app_path}`)

    let has_native = cave.uploads::values()::some((upload) => !!upload[`p_${os.itch_platform()}`])
    let has_html = cave.uploads::values()::some((upload) => upload.type === 'html')
    let launch_type = has_html && !has_native ? 'html' : 'native'
    AppActions.cave_update(id, {launch_type})
    if (launch_type === 'html') {
      let res = await html.configure(app_path)
      AppActions.cave_update(id, res)
      return 'html configure result: ' + JSON.stringify(res)
    } else {
      let executables = (await self.configure(app_path)).executables

      AppActions.cave_update(id, {executables})
      return executables.length + ' candidates'
    }
  }
}

module.exports = self
