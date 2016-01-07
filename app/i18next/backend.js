
let log = require('../util/log')('i18n-backend')
let opts = { logger: new log.Logger() }

let sf = require('../util/sf')
let urls = require('../constants/urls')
let env = require('../env')

let path = require('path')

// for now, fetch once per session
let already_fetched = {}

// don't overwrite local files
let remote_suffix = '.remote.json'

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
    let err_message = null

    for (let candidate of candidates) {
      let canonical_filename = path.join(this.options.loadPath, candidate + '.json')
      let loaded_filename = canonical_filename

      // do we have a newer version?
      if (await sf.exists(canonical_filename + remote_suffix)) {
        loaded_filename = canonical_filename + remote_suffix
      } else if (await sf.exists(canonical_filename)) {
        // all good
      } else {
        // so we don't have it then
        continue
      }

      found = true

      let contents = await sf.read_file(loaded_filename)
      try {
        let parsed = JSON.parse(contents)
        log(opts, `Successfully loaded ${language} from ${loaded_filename} (in ${process.type})`)
        callback(null, parsed)
      } catch (err) {
        err_message = 'error parsing ' + loaded_filename + ': ' + err.message
        continue
      }

      this.queue_download(candidate, canonical_filename, callback)
      break
    }

    if (found) return

    if (!found) {
      log(opts, `No locale file found for language ${language}`)
      callback(null, {})
    }

    if (err_message) {
      callback(err_message, false)
    }
  }

  async queue_download (candidate, local_filename, callback) {
    let remote_filename = local_filename + '.remote.json'

    if (process.type !== 'browser') {
      return
    }

    let p = new Promise((resolve, reject) => {
      setTimeout(resolve, 5000 + Math.random(1500))
    })
    await p

    if (already_fetched[candidate]) {
      return
    }
    already_fetched[candidate] = true

    let uri = `${urls.remote_locale_path}/${candidate}.json`

    log(opts, `Downloading fresh locale file from ${uri}`)

    if (env.name === 'development' && process.env.DID_I_STUTTER !== '1') {
      log(opts, `Not actually downloading locale in development`)
      return
    }

    let needle = require('../promised/needle')
    let resp = await needle.requestAsync('GET', uri, {})
    let body = resp.body

    if (resp.statusCode !== 200) {
      log(opts, `Got HTTP ${resp.statusCode} while fetching fresh locale`)
      return
    }

    try {
      let parsed = JSON.parse(body)
      log(opts, `Successfully parsed ${candidate} from remote locale`)
      callback(null, parsed)
    } catch (err) {
      log(opts, `Error parsing ${uri}: ${err.message}`)
      return
    }

    log(opts, `Saving fresh ${candidate} locale to ${remote_filename}`)
    await sf.write_file(remote_filename, body)
  }

}

Backend.type = 'backend'

module.exports = Backend
