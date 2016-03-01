
const log = require('../util/log')('i18n-store')
let opts = { logger: new log.Logger() }

const AppDispatcher = require('../dispatcher/app-dispatcher')
const AppConstants = require('../constants/app-constants')
const Store = require('./store')

const path = require('path')
const electron = require('electron')
const deepAssign = require('deep-assign')
const sf = require('../util/sf')

let state = {}

let PreferencesStore = Object.assign(new Store('preferences-store'), {
  get_state: () => state
})

let preferences_path = path.join(electron.app.getPath('userData'), 'preferences.json')

async function load_from_disk () {
  try {
    let contents = await sf.read_file(preferences_path)
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
  await sf.write_file(preferences_path, contents)

  PreferencesStore.emit_change()
}

async function set_sniffed_language (payload) {
  state.sniffed_language = payload.language
  log(opts, `Just set sniffed language to: ${state.sniffed_language}`)
  await save_to_disk()
}

async function set_language (payload) {
  if (payload.language === '__') {
    delete state.language
    log(opts, `Just reset language to auto`)
  } else {
    state.language = payload.language
    log(opts, `Just set language to: ${state.language}`)
  }
  await save_to_disk()
}

async function add_install_location (payload) {
  log(opts, `Adding install location: ${JSON.stringify(payload)}`)
  if (!state.install_locations) {
    state.install_locations = {}
  }
  state.install_locations[payload.name] = {
    path: payload.path
  }
  await save_to_disk()
}

async function remove_install_location (payload) {
  log(opts, `Removing install location: ${JSON.stringify(payload)}`)

  deepAssign(state, {
    install_locations: {
      [payload.name]: {
        deleted: true
      }
    }
  })

  let default_loc_name = state.default_install_location || 'appdata'
  let default_loc = state.install_locations[default_loc_name]

  let found_new_default = false

  if (!default_loc || default_loc.deleted) {
    for (let loc_name of Object.keys(state.install_locations)) {
      let loc = state.install_locations[loc_name]
      if (!loc.deleted) {
        found_new_default = true
        state.default_install_location = loc_name
        break
      }
    }
  }

  if (!found_new_default) {
    state.default_install_location = 'appdata'
  }

  await save_to_disk()
}

async function make_install_location_default (payload) {
  log(opts, `Setting default install location: ${JSON.stringify(payload)}`)
  state.default_install_location = payload.name
  await save_to_disk()
}

AppDispatcher.register('preferences-store', Store.action_listeners(on => {
  on(AppConstants.BOOT, load_from_disk)
  on(AppConstants.PREFERENCES_SET_LANGUAGE, set_language)
  on(AppConstants.PREFERENCES_SET_SNIFFED_LANGUAGE, set_sniffed_language)
  on(AppConstants.ADD_INSTALL_LOCATION, add_install_location)
  on(AppConstants.REMOVE_INSTALL_LOCATION, remove_install_location)
  on(AppConstants.MAKE_INSTALL_LOCATION_DEFAULT, make_install_location_default)
}))

module.exports = PreferencesStore
