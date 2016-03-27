
import sniff from '../../util/sniff'
import spawn from '../../util/spawn'
import mklog from '../../util/log'
const log = mklog('install/core')

import ExtendableError from 'es6-error'

class UnhandledFormat extends ExtendableError {
  constructor (archivePath) {
    super(`don't know how to handle ${archivePath}`)
  }
}

const self = {
  UnhandledFormat,

  validInstallers: ['archive', 'dmg', 'msi', 'exe'],

  installerForExt: {
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

  install: async function (out, opts) {
    return await self.operate(out, opts, 'install')
  },

  uninstall: async function (out, opts) {
    return await self.operate(out, opts, 'uninstall')
  },

  cacheType: function (opts, installerName) {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.globalMarket === 'object'
      typeof opts.upload === 'object'
      typeof opts.upload.id === 'number'
      typeof installerName === 'string'
    }

    const {globalMarket, cave} = opts
    if (!cave) return

    const installerCache = {}
    installerCache[opts.uploadId] = installerName
    globalMarket.saveEntity('caves', cave.id, {installerCache})
  },

  retrieveCachedType: function (opts) {
    const cave = opts.cave
    if (!cave) return null

    log(opts, `retrieving installer type of ${opts.archivePath} from cache`)
    const installerCache = cave.installerCache || {}
    const installerName = installerCache[cave.uploadId]

    if (self.validInstallers.indexOf(installerName) === -1) {
      log(opts, `invalid installer name stored: ${installerName} - discarding`)
      return null
    }

    return installerName
  },

  sniffType: async function (opts) {
    const {archivePath} = opts

    const type = await sniff.path(archivePath)
    log(opts, `sniffed type ${JSON.stringify(type)} for ${archivePath}`)
    if (!type) {
      throw new UnhandledFormat(archivePath)
    }

    let installerName = self.installerForExt[type.ext]
    if (!installerName) {
      const code = await spawn({
        command: '7za',
        args: ['l', archivePath]
      })

      if (code === 0) {
        log(opts, `7-zip saves the day! it's an archive.`)
        installerName = 'archive'
      } else if (archivePath.executable) {
        log(opts, `it's executable, going with naked`)
        installerName = 'naked'
      } else {
        throw new UnhandledFormat(`${archivePath} of type ${JSON.stringify(type)}`)
      }
    }

    if (!opts.disableCache) {
      self.cacheType(opts, installerName)
    }
    return installerName
  },

  operate: async function (out, opts, operation) {
    const {archivePath} = opts
    let {installerName} = opts

    if (!installerName && !opts.disableCache) {
      installerName = self.retrieveCachedType(opts)
    }

    if (installerName) {
      log(opts, `using cached installer type ${installerName} for ${archivePath}`)
    } else {
      installerName = await self.sniffType(opts)
    }

    const installer = require(`./${installerName}`).default
    await installer[operation](out, opts)
  }
}

export default self
