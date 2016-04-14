
import needle from '../../promised/needle'
import urls from '../../constants/urls'

import humanize from 'humanize-plus'

import sf from '../sf'
import os from '../os'
import version from './version'
import path from 'path'

import {indexBy, filter, map} from 'underline'

import mklog from '../log'
const log = mklog('ibrew/net')

let self = {
  /**
   * Download to file without butler, because it's used
   * to install butler
   */
  downloadToFile: async (opts, url, file) => {
    let e = null
    let totalSize = 0
    let req = needle.get(url, (err, res) => {
      e = err
      totalSize = parseInt(res.headers['content-length'], 10)
    })
    await sf.mkdir(path.dirname(file))
    log(opts, `downloading ${url} to ${file}`)
    let sink = sf.createWriteStream(file, {flags: 'w', mode: 0o777, defaultEncoding: 'binary'})
    req.pipe(sink)
    await sf.promised(sink)

    if (e) {
      throw e
    }

    const stats = await sf.lstat(file)
    log(opts, `downloaded ${humanize.fileSize(stats.size)} / ${humanize.fileSize(totalSize)} (${stats.size} bytes)`)

    if (totalSize !== 0 && stats.size !== totalSize) {
      throw new Error(`download failed (short size) for ${url}`)
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

  /** build channel URL */
  channel: (formulaName) => {
    let osArch = `${self.os()}-${self.arch()}`
    return `${urls.ibrewRepo}/${formulaName}/${osArch}`
  },

  /** fetch latest version number from repo */
  getLatestVersion: async (channel) => {
    const url = `${channel}/LATEST`
    const res = await needle.getAsync(url)

    if (res.statusCode !== 200) {
      throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`)
    }

    const v = res.body.toString('utf8').trim()
    return version.normalize(v)
  },

  getSHA1Sums: async (opts, channel, v) => {
    const url = `${channel}/v${v}/SHA1SUMS`
    const res = await needle.getAsync(url)

    if (res.statusCode !== 200) {
      log(opts, `couldn't get hashes: HTTP ${res.statusCode}, for ${url}`)
      return null
    }

    const lines = res.body.toString('utf8').split('\n')

    return lines::map((line) => {
      const matches = /^(\S+)\s+(\S+)$/.exec(line)
      if (matches) {
        return {
          sha1: matches[1],
          path: matches[2]
        }
      }
    })::filter((x) => !!x)::indexBy('path')
  }
}

export default self
