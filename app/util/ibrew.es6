
import app from 'app'
import path from 'path'
import fstream from 'fstream'
import Promise from 'bluebird'

import {partial} from 'underscore'
import needle from 'needle'

import extract from '../tasks/extract'
import os from './os'
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
      format: '7z',
      version_check: {
        args: ['version'],
        parser: /butler version ([0-9a-z.v]*)/
      }
    },
    'elevate': {
      format: '7z',
      version_check: {
        args: ['-v'],
        parser: /elevate version ([0-9a-z.v]*)/
      },
      os_whitelist: ['windows']
    }
  },

  bin_path: () => {
    return path.join(app.getPath('userData'), 'bin')
  },

  root_url: () => {
    return 'https://misc.amos.me'
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

  download_to_file: (url, file) => {
    console.log(`downloading ${url} to ${file}`)
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
    let {onstatus = noop} = opts

    let formula = self.formulas[name]
    if (!formula) throw new Error(`Unknown formula: ${name}`)

    let {os_whitelist} = formula
    if (os_whitelist && os_whitelist.indexOf(self.os()) === -1) {
      log(opts, `skipping ${name}, it's irrelevant on ${self.os()}`)
    }

    let channel = `${self.root_url()}/${name}/${self.os()}-${self.arch()}`

    let download_version = async (version) => {
      let archive_name = self.archive_name(name)
      let archive_path = path.join(self.bin_path(), archive_name)
      let archive_url = `${channel}/${version}/${archive_name}`
      onstatus(`Downloading ${name} ${version}`, 'download')
      log(opts, `downloading ${name} ${version} from ${archive_url}`)

      await self.download_to_file(archive_url, archive_path)

      if (formula.format === 'executable') {
        log(opts, `executable formula, no extract step`)
      } else {
        log(opts, `${formula.format} formula, extracting`)
        onstatus(`Installing ${name}`, 'install')
        await extract.extract({ archive_path, dest_path: self.bin_path() })
      }
    }

    onstatus(`Making sure we have the latest of everything...`, 'stopwatch')
    let get_latest_version = partial(self.get_latest_version, channel)

    let check = formula.version_check

    try {
      let info = await os.check_presence(name, check.args, check.parser)
      let local_version = info.parsed
      log(opts, `have local ${name}`)
      let latest_version
      try {
        latest_version = await get_latest_version()
      } catch (e) {
        log(opts, `cannot get latest version: ${e.stack || e}`)
        return
      }

      if (self.version_equal(local_version, latest_version) ||
          local_version === 'head') {
        log(opts, `${name} ${local_version} is the latest`)
        return
      }

      log(opts, `upgrading from ${name} ${local_version} => ${latest_version}`)
      await download_version(latest_version)
    } catch (err) {
      console.log(err.stack || err)
      if (formula.on_missing) formula.on_missing()
      log(opts, `${name} missing, downloading latest`)
      await download_version(await get_latest_version())
    }
  }
}

export default self
