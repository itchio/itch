
let os = require('../util/os')

let log = require('../util/log')('tasks/configure')

let CaveStore = require('../stores/cave-store')
let AppActions = require('../actions/app-actions')

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

    let executables = (await self.configure(app_path)).executables

    AppActions.cave_update(id, {executables})
    return executables.length + ' candidates'
  }
}

module.exports = self
