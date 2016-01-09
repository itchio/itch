
let log = require('../util/log')('i18n-store')
let opts = { logger: new log.Logger() }

let Store = require('./store')
let AppActions = require('../actions/app-actions')

let i18next = require('i18next')
let backend = require('../i18next/backend')

let path = require('path')

/* not using sf because locales list is packed within our app.asar */
let fs = require('fs')

let locales_dir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))
let locales_list_path = path.resolve(path.join(locales_dir, '..', 'locales.json'))

function on_error (err) {
  // apparently the file backend doesn't validate JSON :|
  if (err) {
    let e = new Error(err)
    require('../util/crash-reporter').handle(e)
  }
}

let lang = 'en'
let sniffed_language = 'en'

let i18n_opts = {
  lng: 'en',
  interpolation: {
    escapeValue: false
  },
  fallbackLng: 'en',
  keySeparator: '###',
  returnEmptyString: false,
  backend: {
    // TODO: refresh locales from github
    loadPath: locales_dir
  }
}
i18next.use(backend).init(i18n_opts, on_error)
let state = i18next

let locales_list

// I18nStore can live on both sides: browser & renderer
let I18nStore = Object.assign(new Store('i18n-store', process.type), {
  get_state: () => state,

  get_locales_list: () => {
    if (!locales_list) {
      // bad, but should only happen once at start-up
      let contents = fs.readFileSync(locales_list_path, {encoding: 'utf8'})
      locales_list = JSON.parse(contents).locales
    }

    // TODO: refresh locales list from github
    return locales_list
  },

  get_sniffed_language: () => {
    return sniffed_language
  }
})

state.on('error', (e) => {
  console.log(`Error loading translations: ${e}`)
})

state.on('languageChanged loaded added removed', () => {
  I18nStore.emit_change()
})

if (process.type === 'renderer') {
  try {
    AppActions.preferences_set_sniffed_language(navigator.language)
  } catch (e) {
    console.log(`Could not sniff language from chrome: ${e.stack || e}`)
  }
}

function reload (preferences) {
  sniffed_language = preferences.sniffed_language || 'en'
  lang = preferences.language || sniffed_language
  log(opts, `Switching to language ${lang}`)
  state.changeLanguage(lang, on_error)
}

Store.subscribe('preferences-store', reload)

module.exports = I18nStore
