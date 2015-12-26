
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

let default_location = null
let location_sizes = {}
let location_computing_size = {}
let location_item_counts = {}

let InstallLocationStore = Object.assign(new Store('install-location-store'), {
  get_state: () => {
    let raw_locations = Object.assign({}, PreferencesStore.get_state().install_locations || {}, {default: default_location})
    let locations = {}

    for (let loc_name of Object.keys(raw_locations)) {
      let raw_loc = raw_locations[loc_name]
      let loc = Object.assign({}, raw_loc, {
        size: location_sizes[loc_name] || -1,
        computing_size: location_computing_size[loc_name] || false, // kinda dumb, I know.
        item_count: location_item_counts[loc_name] || 0
      })

      locations[loc_name] = loc
    }

    let aliases = [
      [process.env.HOME, '~']
    ]
    return {locations, aliases}
  },

  get_location: (name) => {
    if (name === 'default') {
      return default_location
    } else {
      let locs = PreferencesStore.get_state().install_locations || {}
      return locs[name]
    }
  }
})

async function reload () {
  log(opts, 'Hi!')

  default_location = {
    name: 'default',
    path: db.library_dir
  }

  location_item_counts = {}

  let caves = await db.find({_table: 'caves'})
  for (let cave of caves) {
    let loc_name = cave.location || 'default'
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

  let on_complete = (result) => {
    if (!result) {
      log(opts, `Install location addition was cancelled`)
      return
    }

    let loc_name = uuid.v4()
    let loc_path = result[0]
    AppActions.install_location_add(loc_name, loc_path)
    log(opts, `Adding install location at ${loc_path} with name ${loc_name}`)
  }
  electron.dialog.showOpenDialog(window, dialog_opts, on_complete)
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
    detail: i18n.t('prompt.install_location_remove.detail'),
    buttons
  }
  electron.dialog.showMessageBox(dialog_opts)
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
  delete location_sizes['default']
  delete location_item_counts['default']
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
