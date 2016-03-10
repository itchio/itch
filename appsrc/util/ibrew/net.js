
import needle from '../../promised/needle'
import urls from '../../constants/urls'

import sf from '../sf'
import os from '../os'
import version from './version'
import path from 'path'

let self = {
  /**
   * Download to file without butler, because it's used
   * to install butler
   */
  download_to_file: async (opts, url, file) => {
    let req = needle.get(url)
    await sf.mkdir(path.dirname(file))
    console.log(`downloading ${url} to ${file}`)
    let sink = sf.createWriteStream(file, {flags: 'w', mode: 0o777, defaultEncoding: 'binary'})
    req.pipe(sink)
    await sf.promised(sink)
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
  get_latest_version: async (channel) => {
    let url = `${channel}/LATEST`
    let res = await needle.getAsync(url)

    if (res.statusCode !== 200) {
      throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`)
    }

    let v = res.body.toString('utf8').trim()
    return version.normalize(v)
  }
}

export default self
