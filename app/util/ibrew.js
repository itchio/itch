

let app = require('electron').app
let path = require('path')
let fstream = require('fstream')
let Promise = require('bluebird')

let partial = require('underscore').partial
let needle = require('needle')

let urls = require('../constants/urls')
let install = require('../tasks/install/core')
let os = require('./os')
let log = require('./log')('ibrew')

let self = {
  formulas: {
    '7za': {
      format: 'executable',
      on_missing: () => {
        if (self.os() === 'linux') {
          // TODO: add link to doc page too
          let msg = '7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)'
          throw new Error(msg)
        }
      },
      version_check: {
        args: [],
        parser: /([0-9a-z.v]*)\s+Copyright/
      }
    },
    'butler': {
      format: '7z'
    },
    'elevate': {
      format: '7z',
      os_whitelist: ['windows']
    },
    'file': {
      format: '7z',
      os_whitelist: ['windows'],
      version_check: {
        args: ['--version'],
        parser: /file-([0-9a-z.]*)/
      }
    }
  },

  bin_path: () => {
    return path.join(app.getPath('userData'), 'bin')
  },

  ext: () => {
    if (os.platform() === 'win32') {
      return '.exe'
    } else {
      return ''
    }
  },

  /** platform in go format */
  os: () => {
    let result = os.platform()
    if (result === 'win32') {
      return 'windows'
    }
    return result
  },

  /** arch in go format */
  arch: () => {
    let result = os.arch()
    if (result === 'x64') {
      return 'amd64'
    } else if (result === 'ia32') {
      return '386'
    } else {
      return 'unknown'
    }
  },

  normalize_version: (version) => {
    return version.replace(/^v/, '')
  },

  version_equal: (a, b) => {
    let aa = self.normalize_version(a)
    let bb = self.normalize_version(b)
    return aa === bb
  },

  archive_name: (name) => {
    let formula = self.formulas[name]

    if (formula.format === '7z') {
      return `${name}.7z`
    } else if (formula.format === 'executable') {
      return `${name}${self.ext()}`
    } else {
      throw new Error(`Unknown formula format: ${formula.format}`)
    }
  },

  download_to_file: (opts, url, file) => {
    let req = needle.get(url)
    let sink = fstream.Writer({
      path: file,
      mode: 0o777
    })
    req.pipe(sink)

    return new Promise((resolve, reject) => {
      sink.on('close', resolve)
      req.on('error', reject)
    })
  },

  get_latest_version: (channel) => {
    return new Promise((resolve, reject) => {
      let url = `${channel}/LATEST`
      needle.get(url, (err, res) => {
        if (err || res.statusCode !== 200) {
          return reject(err || `status code: ${res.statusCode}`)
        }
        let version = res.body.toString('utf8').replace(/\s/g, '')
        resolve(version)
      })
    })
  },

  fetch: async (opts, name) => {
    let noop = () => null
    let onstatus = opts.onstatus || noop

    let formula = self.formulas[name]
    if (!formula) throw new Error(`Unknown formula: ${name}`)

    let os_whitelist = formula.os_whitelist
    if (os_whitelist && os_whitelist.indexOf(self.os()) === -1) {
      log(opts, `${name}: skipping, it's irrelevant on ${self.os()}`)
      return
    }

    let channel = `${urls.ibrew_repo}/${name}/${self.os()}-${self.arch()}`

    let download_version = async (version) => {
      let archive_name = self.archive_name(name)
      let archive_path = path.join(self.bin_path(), archive_name)
      let archive_url = `${channel}/${version}/${archive_name}`
      onstatus('login.status.dependency_install', 'download', {name, version})
      log(opts, `${name}: downloading '${version}' from ${archive_url}`)

      await self.download_to_file(opts, archive_url, archive_path)

      if (formula.format === 'executable') {
        log(opts, `${name}: installed!`)
      } else {
        log(opts, `${name}: extracting ${formula.format} archive`)
        await install.install({ archive_path, dest_path: self.bin_path() })
        log(opts, `${name}: installed!`)
      }
    }

    onstatus('login.status.dependency_check', 'stopwatch')
    let get_latest_version = partial(self.get_latest_version, channel)

    let check = Object.assign({
      args: ['-V'],
      parser: /([a-zA-Z0-9\.]+)/
    }, formula.version_check || {})
    let info

    try {
      info = await os.check_presence(name, check.args, check.parser)
    } catch (err) {
      if (formula.on_missing) formula.on_missing()
      log(opts, `${name}: missing, downloading latest`)
      return await download_version(await get_latest_version())
    }

    let local_version = info.parsed
    log(opts, `${name}: have local version '${local_version}'`)

    let latest_version
    try {
      latest_version = await get_latest_version()
    } catch (err) {
      log(opts, `${name}: cannot get latest version, skipping: ${err.stack || err}`)
      return
    }

    if (self.version_equal(local_version, latest_version) ||
        local_version === 'head') {
      log(opts, `${name}: up-to-date`)
      return
    }

    log(opts, `${name}: upgrading '${local_version}' => '${latest_version}'`)
    await download_version(latest_version)
  }
}

module.exports = self
