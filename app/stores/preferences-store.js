
let log = require('../util/log')('i18n-store')
let opts = { logger: new log.Logger() }

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let Store = require('./store')

let path = require('path')
let electron = require('electron')
let fs = require('../promised/fs')

let state = {}

let PreferencesStore = Object.assign(new Store('preferences-store'), {
  get_state: () => state
})

let preferences_path = path.join(electron.app.getPath('userData'), 'preferences.json')

async function load_from_disk () {
  try {
    let contents = await fs.readFileAsync(preferences_path, {encoding: 'utf8'})
    state = JSON.parse(contents)
    log(opts, `Read preferences: ${JSON.stringify(state, null, 2)}`)

    PreferencesStore.emit_change()
  } catch (e) {
    console.log(`While reading preference: ${e}`)
  }
}

async function save_to_disk () {
  log(opts, `Writing preferences: ${JSON.stringify(state, null, 2)}`)
  let contents = JSON.stringify(state)
  await fs.writeFileAsync(preferences_path, contents)

  PreferencesStore.emit_change()
}

async function set_language (payload) {
  state.language = payload.language
  log(opts, `Just set language to: ${state.language}`)
  await save_to_disk()
}

AppDispatcher.register('preferences-store', Store.action_listeners(on => {
  on(AppConstants.BOOT, load_from_disk)
  on(AppConstants.PREFERENCES_SET_LANGUAGE, set_language)
}))

module.exports = PreferencesStore
