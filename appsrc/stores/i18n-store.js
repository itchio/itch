
import mklog from '../util/log'
const log = mklog('i18n-store')
let opts = {logger: new log.Logger()}

import Store from './store'
import AppActions from '../actions/app-actions'

import i18next from 'i18next'
import backend from '../i18next/backend'

import path from 'path'

/* not using sf because locales list is packed within our app.asar */
import fs from 'fs'

const locales_dir = path.resolve(path.join(__dirname, '..', 'static', 'locales'))
const locales_listPath = path.resolve(path.join(locales_dir, '..', 'locales.json'))

function on_error (err) {
  // apparently the file backend doesn't validate JSON :|
  if (err) {
    let e = new Error(err)
    require('../util/crash-reporter').default.handle(e)
  }
}

let lang = 'en'
let sniffed_language = 'en'

let i18nOpts = {
  lng: 'en',
  interpolation: {
    escapeValue: false
  },
  fallbackLng: 'en',
  keySeparator: '###',
  returnEmptyString: false,
  backend: {

    loadPath: locales_dir
  }
}
i18next.use(backend).init(i18nOpts, on_error)
let state = i18next

let locales_list

// I18nStore can live on both sides: browser & renderer
let I18nStore = Object.assign(new Store('i18n-store', process.type), {
  get_state: () => state,

  get_t: () => state.getFixedT(),

  get_locales_list: () => {
    if (!locales_list) {
      // bad, but should only happen once at start-up
      let contents = fs.readFileSync(locales_listPath, {encoding: 'utf8'})
      locales_list = JSON.parse(contents).locales
    }

    // TODO: refresh locales list from github
    return locales_list
  },

  get_sniffed_language: () => {
    return sniffed_language
  }
})

I18nStore.setMaxListeners(Infinity)

state.on('error', (e) => {
  console.log(`Error loading translations: ${e}`)
})

state.on('languageChanged loaded added removed', (e) => {
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

export default I18nStore
