
let log = require('../util/log')('i18n-store')
let opts = { logger: new log.Logger() }

let Store = require('./store')

let i18next = require('i18next')
let backend = require('i18next-node-fs-backend')

let path = require('path')
let fs = require('../promised/fs')

let locales_dir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))
let locales_list_path = path.resolve(path.join(locales_dir, '..', 'locales.json'))

function on_error (err) {
  // apparently the file backend doesn't validate JSON :|
  if (err) {
    let e = new Error(err)
    require('../util/crash-reporter').handle(e)
  }
}

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
    loadPath: `${locales_dir}/{{lng}}.json`
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
  }
})

state.on('error', (e) => {
  console.log(`Error loading translations: ${e}`)
})

state.on('languageChanged loaded', () => {
  I18nStore.emit_change()
})

function reload (preferences) {
  let lang = preferences.language || 'en'
  log(opts, `Switching to language ${lang}`)
  state.changeLanguage(lang, on_error)
}

Store.subscribe('preferences-store', reload)

module.exports = I18nStore
