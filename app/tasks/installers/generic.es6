
import StreamSearch from 'streamsearch'
import fstream from 'fstream'

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
    // Boyer-Moore - longer strings means search is more efficient
    'inno': 'Inno Setup Setup Data',
    'nsis': 'Nullsoft.NSIS.exehead'
  },

  identify: async function (opts) {
    let {archive_path} = opts

    return await self.sniff(archive_path, self.needles)
  },

  install: async function (opts) {
    let type = await self.identify(opts)
    log(opts, `found generic installer type: ${type}`)

    throw new Error('stub!')
  }
}

export default self
