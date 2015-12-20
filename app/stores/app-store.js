'use strict'

let mori = require('mori')

let Store = require('./store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')
let pairs = require('underscore').pairs

let defer = require('../util/defer')
let env = require('../env')

let state = mori.hashMap(
  'page', 'login',
  'status_message', null,

  'update', mori.hashMap(
    'available', false,
    'downloaded', false
  ),

  'library', mori.hashMap(
    'games', mori.hashMap(),
    'panel', '',
    'collections', mori.hashMap(),
    'caves', mori.hashMap()
  ),

  'login', mori.hashMap(
    'loading', false,
    'errors', null
  ),

  'setup', mori.hashMap(
    'message', '...',
    'icon', 'settings'
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
  state = mori.assocIn(state, ['status_message'], payload.message)
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

function dismiss_status () {
  state = mori.updateIn(state, ['update'], x => mori.dissoc(x, 'error'))
  state = mori.assocIn(state, ['status_message'], null)
  AppStore.emit_change()
}

function focus_panel (payload) {
  let panel = payload.panel

  state = mori.assoc(state, 'page', 'library')
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

  let me = mori.getIn(state, ['library', 'credentials', 'me'])
  if (mori.get(me, 'developer')) {
    focus_panel({panel: 'dashboard'})
  } else {
    focus_panel({panel: 'owned'})
  }

  defer(() => {
    AppActions.fetch_games('dashboard')
  })
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
  state = mori.assocIn(state, ['setup', 'message'], message)
  if (icon) {
    state = mori.assocIn(state, ['setup', 'icon'], icon)
  }
  AppStore.emit_change()
}

function setup_wait (payload) {
  switch_page('setup')
}

function cave_progress (payload) {
  for (let pair of pairs(payload.opts)) {
    let k = pair[0]
    let v = pair[1]
    state = mori.assocIn(state, ['library', 'caves', payload.opts.id, k], mori.toClj(v))
  }
  AppStore.emit_change()
}

function cave_implode (payload) {
}

function cave_thrown_into_bit_bucket (payload) {
  state = mori.updateIn(state, ['library', 'caves'], caves => mori.dissoc(caves, payload.id))
  AppStore.emit_change()
  if (mori.getIn(state, ['library', 'panel']) === `caves/${payload.id}`) {
    AppActions.focus_panel('caved')
  }
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

  on(AppConstants.CAVE_PROGRESS, cave_progress)
  on(AppConstants.CAVE_IMPLODE, cave_implode)

  on(AppConstants.CHECKING_FOR_SELF_UPDATE, checking_for_self_update)
  on(AppConstants.SELF_UPDATE_AVAILABLE, update_available)
  on(AppConstants.SELF_UPDATE_NOT_AVAILABLE, update_not_available)
  on(AppConstants.SELF_UPDATE_DOWNLOADED, update_downloaded)
  on(AppConstants.SELF_UPDATE_ERROR, update_error)
  on(AppConstants.GAME_PURCHASED, game_purchased)
  on(AppConstants.DISMISS_STATUS, dismiss_status)
  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, cave_thrown_into_bit_bucket)

  on(AppConstants.GAIN_FOCUS, (payload) => {
    AppActions.fetch_collections()
    let panel = mori.getIn(state, ['library', 'panel'])
    panel && AppActions.fetch_games(panel)

    if (panel !== 'owned') {
      // buying a game can affect something in any panel
      AppActions.fetch_games('owned')
    }
  })
}))

Store.subscribe('game-store', (games) => {
  state = mori.assocIn(state, ['library', 'games'], mori.toClj(games))
  AppStore.emit_change()
})

Store.subscribe('collection-store', (collections) => {
  state = mori.assocIn(state, ['library', 'collections'], mori.toClj(collections))
  AppStore.emit_change()
})

Store.subscribe('credentials-store', (credentials) => {
  state = mori.assocIn(state, ['library', 'credentials'], mori.toClj(credentials))
  AppStore.emit_change()
})

module.exports = AppStore
