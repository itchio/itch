
let log = require('../../util/log')('tasks/install')
let sniff = require('../../util/sniff')

let ExtendableError = require('es6-error')

class UnhandledFormat extends ExtendableError {
  constructor (operation, archive_path) {
    super(`don't know how to ${operation} ${archive_path}`)
  }
}

let self = {
  UnhandledFormat,

  installer_for_ext: {
    // Generic archives
    'zip': 'archive',
    'gz': 'archive',
    'bz2': 'archive',
    '7z': 'archive',
    'tar': 'archive',
    'xz': 'archive',
    // Apple disk images (DMG)
    'dmg': 'dmg',
    // Microsoft packages
    'msi': 'msi',
    // Inno setup, NSIS
    'exe': 'exe'
  },

  install: async function (opts) {
    return await self.operate(opts, 'install')
  },

  uninstall: async function (opts) {
    return await self.operate(opts, 'uninstall')
  },

  operate: async function (opts, operation) {
    let archive_path = opts.archive_path
    let type = await sniff.path(archive_path)

    if (!type) {
      throw new UnhandledFormat(operation, archive_path)
    }

    log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

    let installer_name = self.installer_for_ext[type.ext]

    if (installer_name) {
      let installer = require(`./${installer_name}`)
      await installer[operation](opts)
    } else {
      throw new UnhandledFormat(operation, `${archive_path} of type ${JSON.stringify(type)}`)
    }
  }
}

module.exports = self
