
let log = require('../util/log')('i18n-backend')
let opts = { logger: new log.Logger() }

let fs = require('../promised/fs')
let path = require('path')

class Backend {
  constructor (services, options) {
    if (typeof options === 'undefined') {
      options = {}
    }
    this.init(services, options)

    this.type = 'backend'
  }

  init (services, options, coreOptions) {
    if (typeof options === 'undefined') {
      options = {}
    }
    if (typeof coreOptions === 'undefined') {
      coreOptions = {}
    }

    this.services = services
    this.options = Object.assign({}, options)
    this.coreOptions = coreOptions
  }

  async read (language, namespace, callback) {
    // We don't use namespaces
    let candidates = [
      language,
      language.substring(0, 2)
    ]

    let found = false

    for (let candidate of candidates) {
      let filename = path.join(this.options.loadPath, candidate + '.json')

      let has = true
      try {
        await fs.lstatAsync(filename)
      } catch (e) {
        has = false
      }
      if (!has) continue

      found = true

      let contents = await fs.readFileAsync(filename, {encoding: 'utf8'})
      try {
        let parsed = JSON.parse(contents)
        log(opts, `Successfully loaded ${language} from ${filename}`)
        callback(null, parsed)
      } catch (err) {
        err.message = 'error parsing ' + filename + ': ' + err.message
        callback(err)
      }
    }

    if (!found) {
      log(opts, `No locale file found for language ${language}`)
      callback(null, {})
    }
  }

}

Backend.type = 'backend'

module.exports = Backend
