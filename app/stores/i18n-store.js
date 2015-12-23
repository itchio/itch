
let log = require('../util/log')('i18n-store')
let opts = { logger: new log.Logger() }

let Store = require('./store')

let i18next = require('i18next')
let backend = require('i18next-node-fs-backend')

let path = require('path')
let locales_dir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))

let i18n_opts = {
  lng: 'en',
  fallbackLng: 'en',
  backend: {
    loadPath: `${locales_dir}/{{lng}}/{{ns}}.json`
  }
}
i18next.use(backend).init(i18n_opts)
let state = i18next

// I18nStore can live on both sides: browser & renderer
let I18nStore = Object.assign(new Store('i18n-store', process.type), {
  get_state: () => state
})

state.on('languageChanged loaded', () => {
  I18nStore.emit_change()
})

function reload (preferences) {
  let lang = preferences.language || 'en'
  log(opts, `Switching to language ${lang}`)
  state.changeLanguage(lang)
}

Store.subscribe('preferences-store', reload)

module.exports = I18nStore
