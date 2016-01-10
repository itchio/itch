
let log = require('../util/log')('i18n-backend/' + process.type)
let opts = { logger: new log.Logger() }

let sf = require('../util/sf')
let fs = require('fs')
let urls = require('../constants/urls')
let env = require('../env')
let upgrades_enabled = env.name === 'production' || process.env.DID_I_STUTTER === '1'

let path = require('path')

let i18next = require('i18next')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let being_fetched = {}

let app
if (process.type === 'browser') {
  app = require('electron').app
} else {
  app = require('electron').remote.app
}

async function exists (file) {
  let p = new Promise((resolve, reject) => {
    fs.access(file, fs.r_OK, (err) => resolve(!err))
  })
  return await p
}

async function read_file (file) {
  let p = new Promise((resolve, reject) => {
    fs.readFile(file, {encoding: 'utf8'}, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
  return await p
}

let remote_dir = path.join(app.getPath('userData'), 'locales')

class Backend {
  constructor (services, options) {
    if (typeof options === 'undefined') {
      options = {}
    }
    this.init(services, options)

    this.type = 'backend'

    AppDispatcher.register('i18n-backend', (payload) => {
      if (payload.action_type === AppConstants.LOCALE_UPDATE_DOWNLOADED) {
        log(opts, `Adding resources to ${payload.lang}`)
        i18next.addResources(
          payload.lang,
          'translation', /* default i18next namespace */
          payload.resources
        )
      } else if (payload.action_type === AppConstants.LOCALE_UPDATE_QUEUE_DOWNLOAD) {
        this.queue_download(payload.lang)
      }
    })
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

  canonical_filename (language) {
    return path.join(this.options.loadPath, language + '.json')
  }

  remote_filename (language) {
    return path.join(remote_dir, language + '.json')
  }

  async read (language, namespace, callback) {
    this.queue_download(language)

    let canonical_filename = this.canonical_filename(language)

    if (!await exists(canonical_filename)) {
      log(opts, `${canonical_filename} does not exist, attempting a trim`)
      canonical_filename = this.canonical_filename(language.substring(0, 2))
      if (!await exists(canonical_filename)) {
        log(opts, `${canonical_filename} does not exist either :(`)
        log(opts, `No locale file found for language ${language}`)
        return callback(null, {})
      }
    }

    let loaded_filename = canonical_filename
    let remote_filename = this.remote_filename(language)

    // do we have a newer version?
    if (upgrades_enabled && await exists(remote_filename)) {
      log(opts, `trying to use ${remote_filename}`)
      // neat, use it.
      loaded_filename = remote_filename
    }

    let contents = await read_file(loaded_filename)
    try {
      let parsed = JSON.parse(contents)
      log(opts, `Successfully loaded ${language} from ${loaded_filename}`)
      return callback(null, parsed)
    } catch (err) {
      log(opts, `Error parsing ${loaded_filename}: ${err.message}`)
      return callback(null, {})
    }
  }

  async queue_download (language) {
    // only run the locale updating routine on the node side
    if (process.type !== 'browser') return

    if (!upgrades_enabled) {
      log(opts, `Not downloading locales in development, export DID_I_STUTTER=1 to override`)
      return
    }

    if (being_fetched[language]) return

    being_fetched[language] = true
    AppActions.locale_update_download_start(language)

    log(opts, `Waiting a bit before downloading ${language} locale..`)
    await cooldown()

    try {
      await this.download_fresh_locale(language)
    } catch (e) {
      log(opts, `While downloading fresh locale: ${e.stack || e}`)
    }

    being_fetched[language] = false
    AppActions.locale_update_download_end(language)
  }

  async download_fresh_locale (language) {
    let local_filename = this.canonical_filename(language)
    if (!await exists(local_filename)) {
      // try stripping region
      language = language.substring(0, 2)
    }

    let remote_filename = this.remote_filename(language)
    let uri = `${urls.remote_locale_path}/${language}.json`

    log(opts, `Downloading fresh locale file from ${uri}`)

    let needle = require('../promised/needle')
    let resp = await needle.requestAsync('GET', uri, {format: 'json'})

    log(opts, `HTTP GET ${uri}: ${resp.statusCode}`)
    let resources = resp.body

    if (resp.statusCode !== 200) {
      log(opts, `Non-200 status code, bailing out`)
      return
    }

    log(opts, `Successfully obtained remote locale ${language}`)
    AppActions.locale_update_downloaded(language, resources)

    log(opts, `Saving fresh ${language} locale to ${remote_filename}`)
    await sf.write_file(remote_filename, JSON.stringify(resources, null, 2))
  }
}

Backend.type = 'backend'

/** Throttling logic */
// Stolen from api.js, once copied another time, make generic
// cf. https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming)

let last_request = 0
let ms_between_requests = 1000

function cooldown () {
  let now = +new Date()
  let next_acceptable = last_request + ms_between_requests
  let quiet = next_acceptable - now

  if (now > next_acceptable) {
    last_request = now
    return Promise.resolve()
  } else {
    last_request = next_acceptable
  }

  return new Promise((resolve, reject) => {
    setTimeout(resolve, quiet)
  })
}

module.exports = Backend
