
let os = require('../util/os')
import { findWhere } from 'underline'

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
        let configurator = require(`./configure/${platform}`)
        return await configurator.configure(app_path)
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  },

  start: async function (opts) {
    let id = opts.id

    let cave = await CaveStore.find(id)

    let app_path = CaveStore.app_path(cave.install_location, id)
    log(opts, `configuring ${app_path}`)

    let uploads = cave.uploads
    if (!uploads) {
      throw new Error(`invalid cave (no uploads), cannot configure`)
    }

    let upload = cave.uploads::findWhere({id: cave.upload_id})
    if (!upload) {
      throw new Error(`invalid cave (upload not found), cannot configure`)
    }

    let launch_type = 'native'
    if (upload.type === 'html') {
      launch_type = 'html'
    }
    AppActions.update_cave(id, {launch_type})

    if (launch_type === 'html') {
      let res = await html.configure(app_path)
      AppActions.update_cave(id, res)
    } else {
      let executables = (await self.configure(app_path)).executables
      AppActions.update_cave(id, {executables})
    }
  }
}

module.exports = self
