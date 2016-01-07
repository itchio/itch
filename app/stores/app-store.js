
let mori = require('mori')

let Store = require('./store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let defer = require('../util/defer')
let patch = require('../util/patch')
let env = require('../env')

let state = mori.hashMap(
  'page', 'login',

  'preferences', mori.hashMap(
    'language', 'en'
  ),

  'update', mori.hashMap(
    'available', false,
    'downloaded', false,
    'status', null
  ),

  'library', mori.hashMap(
    'games', mori.hashMap(),
    'panel', '',
    'collections', mori.hashMap(),
    'caves', mori.hashMap()
  ),

  'login', mori.hashMap(
    'loading', false,
    'errors', null,
    'setup', mori.hashMap(
      'message', '...',
      'variables', null,
      'icon', 'cog'
    )
  )
)

let AppStore = Object.assign(new Store('app-store', 'renderer'), {
  get_state: function () {
    return state
  }
})

function checking_for_self_update (payload) {
  console.log(`checking for self updates...`)
  state = mori.assocIn(state, ['update', 'checking'], true)
  AppStore.emit_change()
}

function update_not_available (payload) {
  state = mori.assocIn(state, ['update', 'checking'], false)
  state = mori.assocIn(state, ['update', 'uptodate'], true)
  AppStore.emit_change()

  setTimeout(function () {
    state = mori.assocIn(state, ['update', 'uptodate'], false)
    AppStore.emit_change()
  }, 5000)
}

function update_available (payload) {
  console.log(`update available? cool!`)
  state = mori.assocIn(state, ['update', 'checking'], false)
  state = mori.assocIn(state, ['update', 'available'], true)
  AppStore.emit_change()
}

function update_downloaded (payload) {
  console.log(`update downloaded?! uber-cool!`)
  state = mori.assocIn(state, ['update', 'downloaded'], true)
  AppStore.emit_change()
}

function game_purchased (payload) {
  state = mori.assocIn(state, ['update', 'status'], payload.message)
  AppStore.emit_change()

  setTimeout(function () {
    dismiss_status()
  }, 5000)
}

function update_error (payload) {
  if (env.name === 'development') {
    console.log(`Ignoring update error ${payload.error} from dev environment`)
    return
  }

  state = mori.assocIn(state, ['update', 'checking'], false)
  state = mori.assocIn(state, ['update', 'available'], false)
  state = mori.assocIn(state, ['update', 'downloaded'], false)
  state = mori.assocIn(state, ['update', 'error'], payload.message)
  AppStore.emit_change()

  setTimeout(function () {
    dismiss_status()
  }, 5000)
}

function locale_update_download_start (payload) {
  state = mori.assocIn(state, ['locales', 'updating'], true)
  AppStore.emit_change()

  setTimeout(locale_update_download_end, 2000)
}

function locale_update_download_end (payload) {
  state = mori.assocIn(state, ['locales', 'updating'], false)
  AppStore.emit_change()
}

function dismiss_status () {
  state = mori.updateIn(state, ['update'], x => mori.dissoc(x, 'error'))
  state = mori.updateIn(state, ['update'], x => mori.dissoc(x, 'status'))
  AppStore.emit_change()
}

function focus_panel (payload) {
  let panel = payload.panel
  let page = mori.get(state, 'page')

  if (page !== 'library') {
    console.log(`Not switching to panel ${panel} while on page ${page}`)
    return
  }

  state = mori.assocIn(state, ['library', 'panel'], panel)
  AppStore.emit_change()

  defer(() => {
    AppActions.focus_window()
    AppActions.fetch_games(panel)
  })
}

function switch_page (page) {
  state = mori.assoc(state, 'page', page)
  AppStore.emit_change()
}

function login_attempt (payload) {
  state = mori.assocIn(state, ['login', 'loading'], true)
  state = mori.assocIn(state, ['login', 'errors'], null)
  AppStore.emit_change()
}

function login_failure (payload) {
  let errors = payload.errors
  state = mori.assocIn(state, ['login', 'loading'], false)
  state = mori.assocIn(state, ['login', 'errors'], errors.stack || errors)
  switch_page('login')
}

function no_stored_credentials () {
  switch_page('login')
}

function ready_to_roll (payload) {
  state = mori.assocIn(state, ['login', 'loading'], false)
  state = mori.assocIn(state, ['login', 'errors'], null)

  let me = mori.getIn(state, ['credentials', 'me'])
  switch_page('library')
  if (mori.get(me, 'developer')) {
    focus_panel({panel: 'dashboard'})
    defer(() => AppActions.fetch_games('dashboard'))
  } else {
    focus_panel({panel: 'owned'})
  }
}

function logout () {
  state = mori.assocIn(state, ['library'], mori.hashMap(
    'games', mori.hashMap(),
    'panel', '',
    'collections', mori.hashMap(),
    'caves', mori.hashMap()
  ))
  AppStore.emit_change()
  switch_page('login')
}

function setup_status (payload) {
  let message = payload.message
  let icon = payload.icon
  let variables = payload.variables
  state = mori.assocIn(state, ['login', 'setup', 'message'], message)
  state = mori.assocIn(state, ['login', 'setup', 'variables'], variables)
  if (icon) {
    state = mori.assocIn(state, ['login', 'setup', 'icon'], icon)
  }
  AppStore.emit_change()
}

function setup_wait () {
  switch_page('setup')
}

function cave_thrown_into_bit_bucket (payload) {
  state = mori.updateIn(state, ['library', 'caves'], caves => mori.dissoc(caves, payload.id))
  AppStore.emit_change()
  if (mori.getIn(state, ['library', 'panel']) === `caves/${payload.id}`) {
    AppActions.focus_panel('caved')
  }
}

function gain_focus (payload) {
  AppActions.fetch_collections()
  let panel = mori.getIn(state, ['library', 'panel'])
  panel && AppActions.fetch_games(panel)

  if (panel !== 'owned') {
    // buying a game can affect something in any panel
    AppActions.fetch_games('owned')
  }
}

function open_preferences (payload) {
  focus_panel({panel: 'preferences'})
}

AppDispatcher.register('app-store', Store.action_listeners(on => {
  on(AppConstants.SETUP_STATUS, setup_status)
  on(AppConstants.SETUP_WAIT, setup_wait)

  on(AppConstants.LIBRARY_FOCUS_PANEL, focus_panel)

  on(AppConstants.NO_STORED_CREDENTIALS, no_stored_credentials)
  on(AppConstants.LOGIN_ATTEMPT, login_attempt)
  on(AppConstants.LOGIN_FAILURE, login_failure)
  on(AppConstants.READY_TO_ROLL, ready_to_roll)
  on(AppConstants.LOGOUT, logout)

  on(AppConstants.CHECKING_FOR_SELF_UPDATE, checking_for_self_update)
  on(AppConstants.SELF_UPDATE_AVAILABLE, update_available)
  on(AppConstants.SELF_UPDATE_NOT_AVAILABLE, update_not_available)
  on(AppConstants.SELF_UPDATE_DOWNLOADED, update_downloaded)
  on(AppConstants.SELF_UPDATE_ERROR, update_error)
  on(AppConstants.GAME_PURCHASED, game_purchased)
  on(AppConstants.DISMISS_STATUS, dismiss_status)
  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, cave_thrown_into_bit_bucket)

  on(AppConstants.GAIN_FOCUS, gain_focus)

  on(AppConstants.GAME_STORE_DIFF, game_store_diff)
  on(AppConstants.CAVE_STORE_DIFF, cave_store_diff)
  on(AppConstants.INSTALL_LOCATION_STORE_DIFF, install_location_store_diff)
  on(AppConstants.OPEN_PREFERENCES, open_preferences)

  on(AppConstants.LOCALE_UPDATE_DOWNLOAD_START, locale_update_download_start)
  on(AppConstants.LOCALE_UPDATE_DOWNLOAD_END, locale_update_download_end)
}))

function game_store_diff (payload) {
  state = patch.applyAt(state, ['library', 'games'], payload.diff)
  AppStore.emit_change()
}

function cave_store_diff (payload) {
  state = patch.applyAt(state, ['library', 'caves'], payload.diff)
  AppStore.emit_change()
}

function install_location_store_diff (payload) {
  state = patch.applyAt(state, ['install-locations'], payload.diff)
  AppStore.emit_change()
}

Store.subscribe('collection-store', (collections) => {
  state = mori.assocIn(state, ['library', 'collections'], mori.toClj(collections))
  AppStore.emit_change()
})

Store.subscribe('credentials-store', (credentials) => {
  state = mori.assoc(state, 'credentials', mori.toClj(credentials))
  AppStore.emit_change()
})

Store.subscribe('preferences-store', (preferences) => {
  state = mori.assoc(state, 'preferences', mori.toClj(preferences))
  AppStore.emit_change()
})

module.exports = AppStore
