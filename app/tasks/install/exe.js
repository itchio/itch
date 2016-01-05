'use strict'


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
    'nsis': 'Nullsoft.NSIS.exehead',
    'air': 'META-INF/AIR/application.xml'
  },

  identify: async function (opts) {
    let archive_path = opts.archive_path

    return await self.sniff(archive_path, self.needles)
  },

  find_installer: async function (opts) {
    if (os.platform() !== 'win32') {
      throw new Error('Exe installers are only supported on Windows')
    }

    let type = await self.identify(opts)

    log(opts, `found generic installer type: ${type}`)

    if (!type) {
      return require(`./naked`)
    }

    return require(`./${type}`)
  },

  install: async function (opts) {
    let installer = await self.find_installer(opts)
    await installer.install(opts)
  },

  uninstall: async function (opts) {
    let installer = await self.find_installer(opts)
    await installer.uninstall(opts)
  }
}

module.exports = self
