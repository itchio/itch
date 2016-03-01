
import configure from './configure'

import CaveStore from '../stores/cave-store'

import native from './launch/native'
import html from './launch/html'

let self = {
  valid_cave: function (cave) {
    switch (cave.launch_type) {
      case 'native':
        return cave.executables && cave.executables.length > 0
      case 'html':
        return cave.game_path && !!cave.window_size
      default:
        return false
    }
  },

  start: async function (opts) {
    let id = opts.id

    let cave = CaveStore.find(id)

    if (!self.valid_cave(cave)) {
      await configure.start(opts)
      cave = CaveStore.find(id)
    }

    let module = {native, html}[cave.launch_type]
    if (!module) {
      throw new Error(`Unsupported launch type '${cave.launch_type}'`)
    }

    if (!self.valid_cave(cave)) {
      throw new Error('Cave is invalid')
    }

    await module.launch(opts, cave)
  }
}

export default self
