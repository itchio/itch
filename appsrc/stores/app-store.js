
let Store = require('./store')
import {hashMap} from 'mori'
import {assocIn, assoc, dissoc, updateIn, getIn, get, toClj} from 'mori-ext'

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let defer = require('../util/defer')
let patch = require('../util/patch')
let env = require('../env')

let state = hashMap(
  'page', 'login',

  'credentials', null,

  'preferences', hashMap(
    'language', 'en'
  ),

  'update', hashMap(
    'available', false,
    'downloaded', false,
    'status', null
  ),

  'library', hashMap(
    'games', hashMap(),
    'panel', '',
    'collections', hashMap(),
    'caves', hashMap()
  ),

  'login', hashMap(
    'loading', false,
    'errors', null,
    'setup', hashMap(
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
  state = state::assocIn(['update', 'checking'], true)
  AppStore.emit_change()
}

function update_not_available (payload) {
  state = state::assocIn(['update', 'checking'], false)
  state = state::assocIn(['update', 'uptodate'], true)
  AppStore.emit_change()

  setTimeout(function () {
    state = state::assocIn(['update', 'uptodate'], false)
    AppStore.emit_change()
  }, 5000)
}

function update_available (payload) {
  console.log(`update available? cool!`)
  state = state::assocIn(['update', 'checking'], false)
  state = state::assocIn(['update', 'available'], true)
  AppStore.emit_change()
}

function update_downloaded (payload) {
  console.log(`update downloaded?! uber-cool!`)
  state = state::assocIn(['update', 'downloaded'], true)
  AppStore.emit_change()
}

function game_purchased (payload) {
  state = state::assocIn(['update', 'status'], payload.message)
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

  state = state::assocIn(['update', 'checking'], false)
  state = state::assocIn(['update', 'available'], false)
  state = state::assocIn(['update', 'downloaded'], false)
  state = state::assocIn(['update', 'error'], payload.message)
  AppStore.emit_change()

  setTimeout(function () {
    dismiss_status()
  }, 5000)
}

function locale_update_download_start (payload) {
  state = state::assocIn(['locales', 'updating'], true)
  AppStore.emit_change()

  setTimeout(locale_update_download_end, 2000)
}

function locale_update_download_end (payload) {
  state = state::assocIn(['locales', 'updating'], false)
  AppStore.emit_change()
}

function dismiss_status () {
  state = state::updateIn(['update'], x => x::dissoc('error'))
  state = state::updateIn(['update'], x => x::dissoc('status'))
  AppStore.emit_change()
}

function focus_panel (payload) {
  let panel = payload.panel
  let page = state::get('page')

  if (page !== 'library') {
    console.log(`Not switching to panel ${panel} while on page ${page}`)
    return
  }

  state = state::assocIn(['library', 'panel'], panel)
  AppStore.emit_change()

  defer(() => {
    AppActions.focus_window()
    AppActions.fetch_games(panel)
  })
}

function switch_page (page) {
  state = state::assoc('page', page)
  AppStore.emit_change()
}

function login_attempt (payload) {
  state = state::assocIn(['login', 'loading'], true)
  state = state::assocIn(['login', 'errors'], null)
  AppStore.emit_change()
}

function login_failure (payload) {
  AppStore.emit('login_failure', {})
  let errors = payload.errors
  state = state::assocIn(['login', 'loading'], false)
  state = state::assocIn(['login', 'errors'], errors.stack || errors)
  switch_page('login')
}

function no_stored_credentials () {
  switch_page('login')
}

function ready_to_roll (payload) {
  state = state::assocIn(['login', 'loading'], false)
  state = state::assocIn(['login', 'errors'], null)

  let me = state::getIn(['credentials', 'me'])
  switch_page('library')
  if (me::get('developer')) {
    focus_panel({panel: 'dashboard'})
    defer(() => AppActions.fetch_games('dashboard'))
  } else {
    focus_panel({panel: 'owned'})
  }
}

function logout () {
  state = state::assocIn(['library'], hashMap(
    'games', hashMap(),
    'panel', '',
    'collections', hashMap(),
    'caves', hashMap()
  ))
  AppStore.emit_change()
  switch_page('login')
}

function setup_status (payload) {
  let message = payload.message
  let icon = payload.icon
  let variables = payload.variables
  state = state::assocIn(['login', 'setup', 'message'], message)
  state = state::assocIn(['login', 'setup', 'variables'], variables)
  if (icon) {
    state = state::assocIn(['login', 'setup', 'icon'], icon)
  }
  AppStore.emit_change()
}

function setup_wait () {
  switch_page('setup')
}

function cave_thrown_into_bit_bucket (payload) {
  state = state::updateIn(['library', 'caves'], caves => caves::dissoc(payload.id))
  AppStore.emit_change()
  if (state::getIn(['library', 'panel']) === `caves/${payload.id}`) {
    AppActions.focus_panel('caved')
  }
}

function gain_focus (payload) {
  AppActions.fetch_collections()
  let panel = state::getIn(['library', 'panel'])
  if (panel) {
    AppActions.fetch_games(panel)
  }

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
  on(AppConstants.CAVE_STORE_CAVE_DIFF, cave_store_cave_diff)
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

function cave_store_cave_diff (payload) {
  state = patch.applyAt(state, ['library', 'caves', payload.cave_id], payload.diff)
  AppStore.emit_change()
}

function install_location_store_diff (payload) {
  state = patch.applyAt(state, ['install-locations'], payload.diff)
  AppStore.emit_change()
}

Store.subscribe('collection-store', (collections) => {
  state = state::assocIn(['library', 'collections'], collections::toClj())
  AppStore.emit_change()
})

Store.subscribe('credentials-store', (credentials) => {
  state = state::assoc('credentials', credentials::toClj())
  AppStore.emit_change()
})

Store.subscribe('preferences-store', (preferences) => {
  state = state::assoc('preferences', preferences::toClj())
  AppStore.emit_change()
})

module.exports = AppStore
