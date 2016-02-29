
let log = require('../../util/log')('install/core')
let sniff = require('../../util/sniff')
let spawn = require('../../util/spawn')

let AppActions = require('../../actions/app-actions')

let ExtendableError = require('es6-error')

class UnhandledFormat extends ExtendableError {
  constructor (archive_path) {
    super(`don't know how to handle ${archive_path}`)
  }
}

let self = {
  UnhandledFormat,

  valid_installers: ['archive', 'dmg', 'msi', 'exe'],

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
    'exe': 'exe',
    // Books!
    'pdf': 'naked',
    // Java things
    'jar': 'naked',
    // some html games provide a single raw html file
    'html': 'naked'
  },

  install: async function (opts) {
    return await self.operate(opts, 'install')
  },

  uninstall: async function (opts) {
    return await self.operate(opts, 'uninstall')
  },

  cache_type: function (opts, installer_name) {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.upload_id === 'number'
      typeof installer_name === 'string'
    }

    let cave = opts.cave
    if (!cave) return

    let installer_cache = {}
    installer_cache[opts.upload_id] = installer_name
    AppActions.update_cave(cave.id, {installer_cache})
  },

  retrieve_cached_type: function (opts) {
    let cave = opts.cave
    if (!cave) return null

    log(opts, `retrieving installer type of ${opts.archive_path} from cache`)
    let installer_cache = cave.installer_cache || {}
    let installer_name = installer_cache[cave.upload_id]

    if (self.valid_installers.indexOf(installer_name) === -1) {
      log(opts, `invalid installer name stored: ${installer_name} - discarding`)
      return null
    }

    return installer_name
  },

  sniff_type: async function (opts) {
    let archive_path = opts.archive_path

    let type = await sniff.path(archive_path)
    log(opts, `sniffed type ${JSON.stringify(type)} for ${archive_path}`)
    if (!type) {
      throw new UnhandledFormat(archive_path)
    }

    let installer_name = self.installer_for_ext[type.ext]
    if (!installer_name) {
      let code = await spawn({
        command: '7za',
        args: ['l', archive_path]
      })

      if (code === 0) {
        log(opts, `7-zip saves the day! it's an archive.`)
        installer_name = 'archive'
      } else if (archive_path.executable) {
        log(opts, `it's executable, going with naked`)
        installer_name = 'naked'
      } else {
        throw new UnhandledFormat(`${archive_path} of type ${JSON.stringify(type)}`)
      }
    }

    if (!opts.disable_cache) {
      self.cache_type(opts, installer_name)
    }
    return installer_name
  },

  operate: async function (opts, operation) {
    let archive_path = opts.archive_path
    let installer_name = opts.installer_name

    if (!installer_name && !opts.disable_cache) {
      installer_name = self.retrieve_cached_type(opts)
    }

    if (installer_name) {
      log(opts, `using cached installer type ${installer_name} for ${archive_path}`)
    } else {
      installer_name = await self.sniff_type(opts)
    }

    let installer = require(`./${installer_name}`)
    await installer[operation](opts)
  }
}

module.exports = self
