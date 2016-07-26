
import invariant from 'invariant'

import fnout from 'fnout'
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
    'rar': 'archive',
    // Apple disk images (DMG)
    'dmg': 'dmg',
    // Microsoft packages
    'msi': 'msi',
    // Inno setup, NSIS
    'exe': 'exe',
    // Books!
    'pdf': 'naked',
    // Known naked
    'jar': 'naked',
    'unitypackage': 'naked',
    'naked': 'naked',
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
    const {globalMarket, cave, upload} = opts
    if (!cave) return

    invariant(typeof installerName === 'string', 'cacheType needs string installerName')
    invariant(typeof upload === 'object', 'cacheType needs object upload')
    invariant(typeof upload.id === 'number', 'cacheType needs int upload.id')

    const installerCache = {}
    installerCache[upload.id] = installerName
    globalMarket.saveEntity('caves', cave.id, {installerCache})
  },

  retrieveCachedType: function (opts) {
    const cave = opts.cave
    if (!cave) return null

    const {archivePath} = opts
    if (!archivePath) {
      log(opts, 'no archive available, can\'t retrieve cached type')
      return
    }

    log(opts, `retrieving installer type of ${archivePath} from cache`)
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
    if (!archivePath) {
      log(opts, 'no archive available, unable to sniff type, going with "archive" uninstaller')
      return 'archive'
    }

    let type
    if (/.(jar|unitypackage)$/i.test(archivePath)) {
      log(opts, `known naked type for ${archivePath}`)
      type = {
        ext: 'naked'
      }
    }

    if (!type) {
      type = await fnout.path(archivePath)
      log(opts, `sniffed type ${JSON.stringify(type)} for ${archivePath}`)
    }

    if (!type) {
      throw new UnhandledFormat(archivePath)
    }

    let installerName = self.installerForExt[type.ext]
    if (!installerName) {
      const code = await spawn({
        command: 'lsar',
        args: [archivePath]
      })

      if (code === 0) {
        log(opts, 'unarchiver saves the day! it is an archive.')
        installerName = 'archive'
      } else if (type.macExecutable || type.linuxExecutable) {
        log(opts, 'tis an executable, going with naked')
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
