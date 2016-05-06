
import StreamSearch from 'streamsearch'
import os from '../../util/os'
import sf from '../../util/sf'
import file from '../../util/file'

import mklog from '../../util/log'
const log = mklog('installers/exe')

import {partial} from 'underline'

let self = {
  validInstallers: ['inno', 'nsis', 'air', 'archive'],

  install: async function (out, opts) {
    let installer = await self.findInstaller(opts)
    await installer.install(out, opts)
  },

  uninstall: async function (out, opts) {
    let installer = await self.findInstaller(opts)
    await installer.uninstall(out, opts)
  },

  findInstaller: async function (opts) {
    if (os.platform() !== 'win32') {
      throw new Error('Exe installers are only supported on Windows')
    }

    let archivePath = opts.archivePath
    let type = self.retrieveCachedType(opts)

    if (type) {
      log(opts, `using cached installer type ${type} for ${archivePath}`)
    } else {
      type = await self.identify(opts)

      if (type) {
        log(opts, `found exe installer type ${type} for ${archivePath}`)
        self.cacheType(opts, type)
      } else {
        // don't cache that, we might find better later
        log(opts, `falling back to 'naked exe' for ${archivePath}`)
        type = 'naked'
      }
    }

    return require(`./${type}`).default
  },

  retrieveCachedType: function (opts) {
    let cave = opts.cave
    if (!cave) return
    log(opts, `got cave: ${JSON.stringify(cave, null, 2)}`)

    let installerExeCache = cave.installerExeCache || {}
    let type = installerExeCache[cave.uploadId]
    log(opts, `found cached installer type ${type}`)

    if (self.validInstallers.indexOf(type) === -1) {
      log(opts, `invalid exe type stored: ${type} - discarding`)
      return null
    }

    return type
  },

  cacheType: function (opts, type) {
    let cave = opts.cave
    if (!cave) return

    let installerExeCache = {}
    installerExeCache[cave.uploadId] = type

    const {globalMarket} = opts
    globalMarket.saveEntity('caves', cave.id, {installerExeCache})
  },

  identify: async function (opts) {
    let kind = await self.builtinSniff(opts, self.builtinNeedles)
    if (!kind) {
      kind = await self.externalSniff(opts, self.externalNeedles)
    }

    return kind
  },

  builtinSniff: async function (opts, needles) {
    let archivePath = opts.archivePath
    let result = null
    let searches = []

    let onInfo = (k, v, isMatch, data, start, end) => {
      if (!isMatch) return
      log(opts, `builtinSniff: found needle ${v}`)
      result = k
    }

    for (let k of Object.keys(needles)) {
      const v = needles[k]
      const search = new StreamSearch(v)
      search.on('info', onInfo::partial(k, v))
      searches.push(search)
    }

    const reader = sf.createReadStream(archivePath, {encoding: 'binary'})
    reader.on('data', (buf) => {
      for (let search of searches) {
        search.push(buf)
      }
    })

    await sf.promised(reader)
    return result
  },

  builtinNeedles: {
    // Boyer-Moore - longer strings means search is more efficient. That said,
    // we don't really use it to skip forward, it just allows us not to scan
    // entire buffers nodes gives us while reading the whole file
    'inno': 'Inno Setup Setup Data',
    'nsis': 'Nullsoft.NSIS.exehead',
    'air': 'META-INF/AIR/application.xml'
  },

  externalSniff: async function (opts, needles) {
    let archivePath = opts.archivePath

    // sample fileOutput:
    // ['PE32 executable (GUI) Intel 80386', 'for MS Windows', 'InstallShield self-extracting archive']
    const fileOutput = await file(archivePath)
    const detail = fileOutput[2]

    if (!detail) return null

    for (let k of Object.keys(needles)) {
      const v = needles[k]
      if (detail === v) {
        log(opts, `externalSniff: found needle ${v}`)
        return k
      }
    }

    return null
  },

  externalNeedles: {
    // Just plain old regex being run on file(1)'s output
    'archive': 'InstallShield self-extracting archive'
  }
}

export default self
