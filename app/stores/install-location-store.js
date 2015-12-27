
let walk = require('walk')
let electron = require('electron')
let uuid = require('node-uuid')

let db = require('../util/db')
let explorer = require('../util/explorer')
let log = require('../util/log')('install-location-store')
let opts = { logger: new log.Logger() }

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')
let Store = require('./store')
let PreferencesStore = require('./preferences-store')
let WindowStore = require('./window-store')
let I18nStore = require('./i18n-store')
let SetupStore = require('./setup-store')

let appdata_location = null
let location_sizes = {}
let location_computing_size = {}
let location_item_counts = {}

let InstallLocationStore = Object.assign(new Store('install-location-store'), {
  get_state: () => {
    let prefs = PreferencesStore.get_state()
    let raw_locations = Object.assign({}, prefs.install_locations || {}, {appdata: appdata_location})
    let locations = {}

    for (let loc_name of Object.keys(raw_locations)) {
      let raw_loc = raw_locations[loc_name]

      let size = location_sizes[loc_name]
      if (typeof size === 'undefined') { size = -1 }

      let computing_size = !!location_computing_size[loc_name]
      let item_count = location_item_counts[loc_name] || 0

      let loc = Object.assign({}, raw_loc, {
        size,
        computing_size,
        item_count
      })

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

async function reload () {
  log(opts, 'Hi!')

  appdata_location = {
    name: 'appdata',
    path: db.library_dir
  }

  location_item_counts = {}

  let caves = await db.find({_table: 'caves'})
  for (let cave of caves) {
    let loc_name = cave.location || 'appdata'
    if (typeof location_item_counts[loc_name] === 'undefined') {
      location_item_counts[loc_name] = 0
    }
    location_item_counts[loc_name]++
  }

  InstallLocationStore.emit_change()
}

function install_location_compute_size (payload) {
  let name = payload.name
  log(opts, `Computing location of ${name}`)

  let loc = InstallLocationStore.get_location(name)
  if (!loc) {
    log(opts, `Unknown location, bailing out: ${loc}`)
  }

  let total_size = 0
  location_sizes[name] = 0
  location_computing_size[name] = true
  let walker = walk.walk(loc.path)

  walker.on('file', (root, fileStats, next) => {
    total_size += fileStats.size
    location_sizes[name] = total_size
    log(opts, `Size of ${name} so far: ${total_size}`)
    InstallLocationStore.emit_change()
    next()
  })

  walker.on('end', () => {
    log(opts, `Done computing size of ${name}!`)
    location_sizes[name] = total_size
    location_computing_size[name] = false
    InstallLocationStore.emit_change()
  })
}

async function install_location_add_request () {
  let i18n = I18nStore.get_state()

  let dialog_opts = {
    title: i18n.t('prompt.install_location_add.title'),
    properties: ['openDirectory']
  }
  let window
  WindowStore.with(w => window = w)

  let callback = (response) => {
    if (!response) {
      log(opts, `Install location addition was cancelled`)
      return
    }

    let loc_name = uuid.v4()
    let loc_path = response[0]
    AppActions.install_location_add(loc_name, loc_path)
    log(opts, `Adding install location at ${loc_path} with name ${loc_name}`)
  }
  electron.dialog.showOpenDialog(window, dialog_opts, callback)
}

async function install_location_remove_request (payload) {
  let name = payload.name
  let loc = InstallLocationStore.get_location(name)
  if (!loc) {
    log(opts, `Cannot remove unknown location ${loc}`)
    return
  }

  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.action.confirm_removal'),
    i18n.t('prompt.action.cancel')
  ]

  let dialog_opts = {
    title: i18n.t('prompt.install_location_remove.title'),
    message: i18n.t('prompt.install_location_remove.message'),
    detail: i18n.t('prompt.install_location_remove.detail', {location: loc.path}),
    buttons
  }

  let callback = (response) => {
    if (response === 0) {
      AppActions.install_location_remove(payload.id)
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

async function install_location_browse (payload) {
  let name = payload.name
  let loc = InstallLocationStore.get_location(name)
  if (!loc) {
    log(opts, `Cannot browse unknown location ${loc}`)
    return
  }

  log(opts, `Browsing location ${loc}`)
  explorer.open(loc.path)
}

async function logout () {
  delete location_sizes['appdata']
  delete location_item_counts['appdata']
}

AppDispatcher.register('install-location-store', Store.action_listeners(on => {
  on(AppConstants.READY_TO_ROLL, reload)
  on(AppConstants.LOGOUT, logout)
  on(AppConstants.INSTALL_LOCATION_COMPUTE_SIZE, install_location_compute_size)
  on(AppConstants.INSTALL_LOCATION_BROWSE, install_location_browse)
  on(AppConstants.INSTALL_LOCATION_ADD_REQUEST, install_location_add_request)
  on(AppConstants.INSTALL_LOCATION_ADDED, reload)
  on(AppConstants.INSTALL_LOCATION_REMOVE_REQUEST, install_location_remove_request)
  on(AppConstants.INSTALL_LOCATION_REMOVED, reload)
}))

PreferencesStore.add_change_listener('install-location-store', () => {
  if (!SetupStore.is_ready()) return
  reload()
})

module.exports = InstallLocationStore
