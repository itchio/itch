
// TODO make preferences a store too.
let preferences = require('../util/preferences')
let log = require('../util/log')('i18n-store')
let opts = {
  logger: new log.Logger()
}

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
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
  console.log(`i18n initialized! sample: ` + state.t('menu.file.file'))
  I18nStore.emit_change()
})

function reload () {
  let lng = preferences.read('language') || 'en'
  log(opts, `Initializing i18n with language ${lng}`)
  state.changeLanguage(lng)
}

AppDispatcher.register('i18n-store', Store.action_listeners(on => {
  if (process.type === 'renderer') {
    on(AppConstants.WINDOW_READY, reload)
  } else {
    on(AppConstants.BOOT, reload)
  }
  on(AppConstants.SAVE_PREFERENCES, reload)
}))

module.exports = I18nStore
