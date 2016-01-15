
let archive = require('./archive')
let os = require('../util/os')

let self = {
  install: async (opts) => {
    if (os.itch_platform() !== 'linux') {
      throw new Error(`.deb packages are only supported on Linux`)
    }

    return await archive.install(Object.assign({}, opts, {
      sevenzip: '7z'
    }))
  },

  uninstall: async (opts) => {
    return await archive.uninstall(opts)
  }
}

module.exports = self
