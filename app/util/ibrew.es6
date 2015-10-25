
import app from 'app'
import path from 'path'
import fstream from 'fstream'
import Promise from 'bluebird'

import needle from 'needle'

import extract from '../tasks/extract'
import os from './os'
let log = require('./log')('ibrew')

let self = {
  formulas: {
    '7za': {
      format: 'executable',
      check: () => {
        if (self.os() === 'linux') {
          // TODO: add link to doc page too
          let msg = '7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)'
          throw new Error(msg)
        }
      },
      version_check: {
        args: [],
        parser: /p7zip Version ([0-9.]*)/
      }
    },
    'butler': {
      format: '7z',
      version_check: {
        args: ['version'],
        parser: /butler version ([0-9a-z.v]*)/
      }
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
    return self.normalize_version(a) === self.normalize_version(b)
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

  fetch: (opts, name) => {
    let noop = () => null
    let {onstatus = noop} = opts

    let formula = self.formulas[name]
    if (!formula) return Promise.reject(`Unknown formula: ${name}`)

    let channel = `${self.root_url()}/${name}/${self.os()}-${self.arch()}`

    let download_version = (version) => {
      console.log('download_version() ' + version)

      let archive_name = self.archive_name(name)
      let archive_url = `${channel}/${version}/${archive_name}`
      onstatus(`Downloading ${name} ${version}`, 'download')
      log(opts, `downloading ${name} ${version} from ${archive_url}`)

      let req = needle.get(archive_url)
      let archive_path = path.join(self.bin_path(), archive_name)
      let sink = fstream.Writer({
        path: archive_path,
        mode: 0o777
      })
      req.pipe(sink)

      return new Promise((resolve, reject) => {
        sink.on('close', () => {
          if (formula.format === 'executable') {
            log(opts, `executable formula, no extract step`)
            resolve()
          } else {
            log(opts, `${formula.format} formula, extracting`)
            onstatus(`Installing ${name}`, 'install')
            extract.extract({
              archive_path,
              dest_path: self.bin_path()
            }).then(resolve)
          }
        })
        req.on('error', reject)
      })
    }

    let get_latest_version = () => {
      return new Promise((resolve, reject) => {
        let url = `${channel}/LATEST`
        needle.get(url, (err, res) => {
        console.log('err, res = ' + err + ', ' + res)
          if (err || res.statusCode !== 200) {
            return reject(err || `status code: ${res.statusCode}`)
          }
          let version = res.body.toString('utf8').replace(/\s/g, '')
          resolve(version)
        })
      })
    }

    onstatus(`Making sure we have the latest of everything...`, 'stopwatch')
    return os.check_presence(name, formula.version_check.args, formula.version_check.parser)
      .then((info) => {
        let local_version = info.parsed
        log(opts, `have local ${name}`)
        return get_latest_version()
          .then((latest_version) => {
            if (self.version_equal(local_version, latest_version)) {
              log(opts, `${name} ${local_version} is the latest`)
              return
            }
            log(opts, `upgrading from ${name} ${local_version} => ${latest_version}`)
            return download_version(latest_version)
          })
      })
      .catch((err) => {
        console.log(err.stack || err)
        if (formula.check) formula.check()
        log(opts, `${name} missing, downloading latest`)
        return get_latest_version().then(download_version)
      })
  }
}

export default self
