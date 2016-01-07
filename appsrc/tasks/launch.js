
let log = require('../util/log')('tasks/launch')
let configure = require('./configure')

let CaveStore = require('../stores/cave-store')

let launch_native = require('./launch/native').launch
let launch_html = require('./launch/html').launch

let self = {
  valid_cave: function (cave) {
    switch (cave.launch_type) {
      case 'native':
        return cave.executables && cave.executables.length > 0
      case 'html':
        return cave.game_root && cave.window_size
      default:
        return false
    }
  },

  start: async function (opts) {
    let id = opts.id

    let cave = await CaveStore.find(id)

    if (!self.valid_cave(cave)) {
      await configure.start(opts)
      cave = await CaveStore.find(id)
    }

    if (!self.valid_cave(cave)) {
      throw new Error('Cave is invalid')
    }

    let launch_func = {native: launch_native, html: launch_html}[cave.launch_type]
    if (!launch_func) {
      throw new Error(`Unsupported launch type '${cave.launch_type}'`)
    }

    await launch_func(opts, cave)
  }
}

module.exports = self
