
import {throttle, each} from 'underline'

import walk from 'walk'
import electron from 'electron'
import uuid from 'node-uuid'
import deep from 'deep-diff'
import deepAssign from 'deep-assign'
import humanize from 'humanize-plus'

import market from '../util/market'
import explorer from '../util/explorer'
import diskspace from '../util/diskspace'
import mklog from '../util/log'
const log = mklog('install-location-store')
const opts = { logger: new log.Logger() }

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'
import Store from './store'
import PreferencesStore from './preferences-store'
import WindowStore from './window-store'
import I18nStore from './i18n-store'
import SetupStore from './setup-store'

let appdata_location = null
let computations_to_cancel = {}
let location_sizes = {}
let location_computing_size = {}
let location_item_counts = {}
let disk_info = { parts: [] }

let state = {}

let InstallLocationStore = Object.assign(new Store('install-location-store'), {
  get_state: () => {
    return state
  },

  get_location: (name) => {
    if (name === 'appdata') {
      return appdata_location
    } else {
      let locs = PreferencesStore.get_state().install_locations || {}
      return locs[name]
    }
  }
})

function compute_state () {
  let prefs = PreferencesStore.get_state()
  let pref_locs = prefs.install_locations || {}
  let raw_locations = deepAssign({}, pref_locs, {appdata: appdata_location})
  let locations = {}

  for (let loc_name of Object.keys(raw_locations)) {
    let raw_loc = raw_locations[loc_name]

    let size = location_sizes[loc_name]
    if (typeof size === 'undefined') { size = -1 }

    let free_space = diskspace.free_in_folder(disk_info, raw_loc.path)

    let computing_size = !!location_computing_size[loc_name]
    let item_count = location_item_counts[loc_name] || 0

    let loc = Object.assign({}, raw_loc, {
      size,
      free_space,
      computing_size,
      item_count
    })

    if (loc_name === 'appdata') {
      // you can't delete appdata! it's your user-specific fallback.
      delete loc.deleted
    }

    locations[loc_name] = loc
  }

  let aliases = [
    [process.env.HOME, '~']
  ]

  return {
    locations,
    aliases,
    default: prefs.default_install_location || 'appdata'
  }
}

function recompute_state () {
  let old_state = state
  let new_state = compute_state()
  let state_diff = deep.diff(old_state, new_state)

  if (!state_diff) return
  AppActions.install_location_store_diff(state_diff)

  InstallLocationStore.emit_change()
}

let throttled_recompute_state = recompute_state::throttle(500, true)

function initialize_appdata () {
  appdata_location = {
    name: 'appdata',
    path: market.get_library_dir()
  }
}

async function reload () {
  initialize_appdata()

  const counts = {}
  const caves = market.get_entities()['caves']

  caves::each((cave) => {
    const loc_name = cave.install_location || 'appdata'
    counts[loc_name] = (counts[loc_name] || 0) + 1
  })

  disk_info = await diskspace.disk_info()
  location_item_counts = counts
  throttled_recompute_state()
}

const throttled_reload = reload::throttle(500)

function compute_install_location_size (payload) {
  const name = payload.name
  log(opts, `Computing location of ${name}`)

  delete computations_to_cancel[name]

  const loc = InstallLocationStore.get_location(name)
  if (!loc) {
    log(opts, `Unknown location, bailing out: ${loc}`)
  }

  let total_size = 0
  location_sizes[name] = 0
  location_computing_size[name] = true
  const walker = walk.walk(loc.path)

  walker.on('file', (root, fileStats, next) => {
    total_size += fileStats.size
    location_sizes[name] = total_size
    throttled_recompute_state()

    if (computations_to_cancel[name]) {
      delete computations_to_cancel[name]
      // location size will be inaccurate but, eh, user cancelled.
      // it might also be inaccurate because files were added since
      // last computed. it's not an exact science.
      location_computing_size[name] = false
      throttled_recompute_state()

      // not calling 'next' here will stop file walk
    } else {
      next()
    }
  })

  walker.on('end', () => {
    log(opts, `Total size of ${name}: ${humanize.fileSize(total_size)}`)
    location_sizes[name] = total_size
    location_computing_size[name] = false
    throttled_recompute_state()
  })
}

function cancel_install_location_size_computation (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.name === 'string'
  }
  computations_to_cancel[payload.name] = true
}

async function add_install_location_request () {
  let i18n = I18nStore.get_state()

  let dialog_opts = {
    title: i18n.t('prompt.install_location_add.title'),
    properties: ['openDirectory']
  }
  let window
  WindowStore.with(w => window = w)

  const callback = (response) => {
    if (!response) {
      log(opts, `Install location addition was cancelled`)
      return
    }

    const loc_name = uuid.v4()
    const loc_path = response[0]
    AppActions.add_install_location(loc_name, loc_path)
    log(opts, `Adding install location at ${loc_path} with name ${loc_name}`)
  }
  electron.dialog.showOpenDialog(window, dialog_opts, callback)
}

async function remove_install_location_request (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.name === 'string'
  }

  const name = payload.name
  const i18n = I18nStore.get_state()

  const locations = compute_state().locations
  if (locations.length <= 1) {
    let title = i18n.t('prompt.last_remaining_install_location.title')
    let content = i18n.t('prompt.last_remaining_install_location.content')
    electron.dialog.showErrorBox(title, content)
    return
  }

  // call compute_state explicitly so we have fresh state regardless of throttling
  const loc = locations[name]
  if (!loc) {
    log(opts, `Cannot remove unknown location ${loc}`)
    return
  }

  if (loc.item_count > 0) {
    const buttons = [
      i18n.t('prompt.install_location_not_empty.show_contents'),
      i18n.t('prompt.action.ok')
    ]

    const dialog_opts = {
      title: i18n.t('prompt.install_location_not_empty.title'),
      message: i18n.t('prompt.install_location_not_empty.message'),
      detail: i18n.t('prompt.install_location_not_empty.detail'),
      buttons
    }

    const callback = (response) => {
      if (response === 0) {
        AppActions.focus_panel(`locations/${name}`)
      }
    }
    electron.dialog.showMessageBox(dialog_opts, callback)
  } else {
    const buttons = [
      i18n.t('prompt.action.confirm_removal'),
      i18n.t('prompt.action.cancel')
    ]

    const dialog_opts = {
      title: i18n.t('prompt.install_location_remove.title'),
      message: i18n.t('prompt.install_location_remove.message'),
      detail: i18n.t('prompt.install_location_remove.detail', {location: loc.path}),
      buttons
    }

    const callback = (response) => {
      if (response === 0) {
        AppActions.remove_install_location(payload.name)
      }
    }
    electron.dialog.showMessageBox(dialog_opts, callback)
  }
}

async function browse_install_location (payload) {
  const name = payload.name
  const loc = InstallLocationStore.get_location(name)
  if (!loc) {
    log(opts, `Cannot browse unknown location ${loc}`)
    return
  }

  log(opts, `Browsing location ${name}`)
  explorer.open(loc.path)
}

async function ready_to_roll () {
  initialize_appdata()
  await reload()
  AppActions.locations_ready()
}

async function logout () {
  appdata_location = null
  delete location_sizes['appdata']
  delete location_item_counts['appdata']
}

async function library_focus_panel (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.panel === 'string'
  }
  const panel = payload.panel
  if (panel === 'preferences') {
    throttled_reload()
  }
}

AppDispatcher.register('install-location-store', Store.action_listeners(on => {
  on(AppConstants.READY_TO_ROLL, ready_to_roll)
  on(AppConstants.CAVE_PROGRESS, throttled_reload)
  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, throttled_reload)
  on(AppConstants.LOGOUT, logout)
  on(AppConstants.LIBRARY_FOCUS_PANEL, library_focus_panel)
  on(AppConstants.COMPUTE_INSTALL_LOCATION_SIZE, compute_install_location_size)
  on(AppConstants.CANCEL_INSTALL_LOCATION_SIZE_COMPUTATION, cancel_install_location_size_computation)
  on(AppConstants.BROWSE_INSTALL_LOCATION, browse_install_location)
  on(AppConstants.ADD_INSTALL_LOCATION_REQUEST, add_install_location_request)
  on(AppConstants.ADD_INSTALL_LOCATIONED, throttled_reload)
  on(AppConstants.REMOVE_INSTALL_LOCATION_REQUEST, remove_install_location_request)
  on(AppConstants.REMOVE_INSTALL_LOCATIOND, throttled_reload)
}))

PreferencesStore.add_change_listener('install-location-store', () => {
  if (!SetupStore.is_ready()) return
  reload()
})

export default InstallLocationStore
