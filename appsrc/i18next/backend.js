
let os = require('../util/os')
let app = require('../util/app')

let log = require('../util/log')('i18n-backend/' + os.process_type())
let opts = { logger: new log.Logger() }

let needle = require('../promised/needle')
let ifs = require('./ifs')
let urls = require('../constants/urls')
let env = require('../env')
let upgrades_enabled = env.name === 'production' || process.env.DID_I_STUTTER === '1'

let path = require('path')

let i18next = require('i18next')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let being_fetched = {}

let remote_dir = path.join(app.getPath('userData'), 'locales')

class Backend {
  constructor (services, options) {
    this.init(services, options)
    this.type = 'backend'

    AppDispatcher.register('i18n-backend', this.on_event.bind(this))
  }

  on_event (payload) {
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
  }

  init (services, options, coreOptions) {
    this.services = services
    this.options = Object.assign({}, options)
    this.coreOptions = Object.assign({}, coreOptions)
    log(opts, `initialized`)
  }

  canonical_filename (language) {
    return path.join(this.options.loadPath, language + '.json')
  }

  remote_filename (language) {
    return path.join(remote_dir, language + '.json')
  }

  async read (language, namespace, callback) {
    let canonical_filename = this.canonical_filename(language)

    if (!await ifs.exists(canonical_filename)) {
      log(opts, `${canonical_filename} does not exist, attempting a trim`)
      canonical_filename = this.canonical_filename(language.substring(0, 2))

      if (!await ifs.exists(canonical_filename)) {
        log(opts, `${canonical_filename} does not exist either :(`)
        log(opts, `No locale file found for language ${language}`)
        log(opts, `Returning null resources`)
        return callback(null, {})
      }
    }

    let loaded_filename = canonical_filename
    let remote_filename = this.remote_filename(language)

    let contents = await ifs.read_file(loaded_filename)

    try {
      let parsed = JSON.parse(contents)
      log(opts, `Successfully loaded ${language} from ${loaded_filename}`)

      // do we have a newer version?
      if (upgrades_enabled && await ifs.exists(remote_filename)) {
        log(opts, `adding ${remote_filename} on top`)
        // neat, use it.
        let additional_contents = await ifs.read_file(remote_filename)
        try {
          let additional_parsed = JSON.parse(additional_contents)
          Object.assign(parsed, additional_parsed)
        } catch (err) {
          log(opts, `While parsing remote locale ${remote_filename}: ${err.message}`)
        }
      }

      log(opts, `Giving callback ${Object.keys(parsed).length} entries`)
      callback(null, parsed)
      await this.queue_download(language)
    } catch (err) {
      log(opts, `Error parsing ${loaded_filename}: ${err.message}`)
      log(opts, `Returning null resources`)
      callback(null, {})
    }
  }

  async queue_download (language) {
    // only run the locale updating routine on the node side
    if (os.process_type() !== 'browser') return

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
    if (!await ifs.exists(local_filename)) {
      // try stripping region
      language = language.substring(0, 2)
    }

    let remote_filename = this.remote_filename(language)
    let uri = `${urls.remote_locale_path}/${language}.json`

    log(opts, `Downloading fresh locale file from ${uri}`)

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
    await ifs.write_file(remote_filename, JSON.stringify(resources, null, 2))
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
