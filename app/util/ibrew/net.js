
let needle = require('../../promised/needle')
let sf = require('../../util/sf')
let urls = require('../../constants/urls')

let os = require('../os')
let version = require('./version')

let self = {
  /**
   * Download to file without butler, because it's used
   * to install butler
   */
  download_to_file: async (opts, url, file) => {
    let req = needle.get(url)
    let sink = sf.Writer({ path: file, mode: 0o777 })
    req.pipe(sink)
    return await sf.promised(sink)
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
  channel: (formula_name) => {
    let os_arch = `${self.os()}-${self.arch()}`
    return `${urls.ibrew_repo}/${formula_name}/${os_arch}`
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

module.exports = self
