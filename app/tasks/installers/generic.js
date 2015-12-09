'use nodent';'use strict'

let StreamSearch = require('streamsearch')
let fstream = require('fstream')
let os = require('../../util/os')

let log = require('../../util/log')('installers/generic')

let self = {
  sniff: function (path, patterns) {
    let options = Object.keys(patterns)

    let result = null
    let searches = []
    for (let k of options) {
      let search = new StreamSearch(patterns[k])
      search.on('info', (isMatch, data, start, end) => {
        if (isMatch) {
          result = k
        }
      })
      searches.push(search)
    }

    let reader = fstream.Reader(path)
    reader.on('data', buf => {
      searches.forEach((search) => search.push(buf))
    })

    return new Promise((resolve, reject) => {
      reader.on('end', () => {
        resolve(result)
      })
    })
  },

  needles: {
    // Boyer-Moore - longer strings means search is more efficient. That said,
    // we don't really use it to skip forward, it just allows us not to scan
    // entire buffers nodes gives us while reading the whole file
    'inno': 'Inno Setup Setup Data',
    'nsis': 'Nullsoft.NSIS.exehead'
  },

  identify: async function (opts) {
    let {archive_path} = opts

    return await self.sniff(archive_path, self.needles)
  },

  install: async function (opts) {
    if (os.platform() !== 'win32') {
      throw new Error('MSI files are only supported on Windows')
    }

    let type = await self.identify(opts)

    log(opts, `found generic installer type: ${type}`)

    if (!type) {
      throw new Error(`unsupported installer type: ${type}`)
    }

    let installer = require(`./${type}`)
    await installer.install(opts)
  }
}

module.exports = self
