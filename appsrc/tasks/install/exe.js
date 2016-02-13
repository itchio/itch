
let StreamSearch = require('streamsearch')
let os = require('../../util/os')
let sf = require('../../util/sf')
let log = require('../../util/log')('installers/exe')

let AppActions = require('../../actions/app-actions')

import {partial} from 'underline'

let self = {
  valid_installers: ['inno', 'nsis', 'air', 'archive'],

  install: async function (opts) {
    let installer = await self.find_installer(opts)
    await installer.install(opts)
  },

  uninstall: async function (opts) {
    let installer = await self.find_installer(opts)
    await installer.uninstall(opts)
  },

  find_installer: async function (opts) {
    if (os.platform() !== 'win32') {
      throw new Error('Exe installers are only supported on Windows')
    }

    let archive_path = opts.archive_path
    let type = self.retrieve_cached_type(opts)

    if (type) {
      log(opts, `using cached installer type ${type} for ${archive_path}`)
    } else {
      type = await self.identify(opts)

      if (type) {
        log(opts, `found exe installer type ${type} for ${archive_path}`)
        self.cache_type(opts, type)
      } else {
        // don't cache that, we might find better later
        log(opts, `falling back to 'naked exe' for ${archive_path}`)
        type = 'naked'
      }
    }

    return require(`./${type}`)
  },

  retrieve_cached_type: function (opts) {
    let cave = opts.cave
    if (!cave) return
    log(opts, `got cave: ${JSON.stringify(cave, null, 2)}`)

    let installer_exe_cache = cave.installer_exe_cache || {}
    let type = installer_exe_cache[cave.upload_id]
    log(opts, `found cached installer type ${type}`)

    if (self.valid_installers.indexOf(type) === -1) {
      log(opts, `invalid exe type stored: ${type} - discarding`)
      return null
    }

    return type
  },

  cache_type: function (opts, type) {
    let cave = opts.cave
    if (!cave) return

    let installer_exe_cache = {}
    installer_exe_cache[cave.upload_id] = type
    AppActions.update_cave(cave._id, {installer_exe_cache})
  },

  identify: async function (opts) {
    let kind = await self.builtin_sniff(opts, self.builtin_needles)
    if (!kind) {
      kind = await self.external_sniff(opts, self.external_needles)
    }

    return kind
  },

  builtin_sniff: async function (opts, needles) {
    let archive_path = opts.archive_path
    let result = null
    let searches = []

    let on_info = (k, v, isMatch, data, start, end) => {
      if (!isMatch) return
      log(opts, `builtin_sniff: found needle ${v}`)
      result = k
    }

    for (let k of Object.keys(needles)) {
      let v = needles[k]
      let search = new StreamSearch(v)
      search.on('info', on_info::partial(k, v))
      searches.push(search)
    }

    let reader = sf.createReadStream(archive_path, { encoding: 'binary' })
    reader.on('data', buf => {
      for (let search of searches) {
        search.push(buf)
      }
    })

    await sf.promised(reader)
    return result
  },

  builtin_needles: {
    // Boyer-Moore - longer strings means search is more efficient. That said,
    // we don't really use it to skip forward, it just allows us not to scan
    // entire buffers nodes gives us while reading the whole file
    'inno': 'Inno Setup Setup Data',
    'nsis': 'Nullsoft.NSIS.exehead',
    'air': 'META-INF/AIR/application.xml'
  },

  external_sniff: async function (opts, needles) {
    let archive_path = opts.archive_path

    // sample file_output:
    // ['PE32 executable (GUI) Intel 80386', 'for MS Windows', 'InstallShield self-extracting archive']
    let file = require('../../util/file')
    let file_output = await file(archive_path)
    let detail = file_output[2]

    if (!detail) return null

    for (let k of Object.keys(needles)) {
      let v = needles[k]
      if (detail === v) {
        log(opts, `external_sniff: found needle ${v}`)
        return k
      }
    }

    return null
  },

  external_needles: {
    // Just plain old regex being run on file(1)'s output
    'archive': 'InstallShield self-extracting archive'
  }
}

module.exports = self
