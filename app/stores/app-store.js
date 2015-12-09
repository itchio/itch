'use nodent';'use strict'

let mori = require('mori')

let Store = require('./store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')
let pairs = require('underscore').pairs

let defer = require('../util/defer')

let state = mori.hashMap(
  'page', 'login',

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

function focus_panel (action) {
  let {panel} = action

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

function login_attempt (action) {
  state = mori.assocIn(state, ['login', 'loading'], true)
  AppStore.emit_change()
}

function login_failure (action) {
  let {errors} = action
  state = mori.assocIn(state, ['login', 'loading'], false)
  state = mori.assocIn(state, ['login', 'errors'], errors.stack || errors)
  switch_page('login')
}

function no_stored_credentials () {
  switch_page('login')
}

function authenticated (action) {
  state = mori.assocIn(state, ['login', 'loading'], false)
  state = mori.assocIn(state, ['login', 'errors'], null)
  focus_panel({panel: 'owned'})

  defer(() => {
    AppActions.fetch_games('dashboard')
  })
}

function logout () {
  switch_page('login')
}

function setup_status (action) {
  let {message, icon} = action
  state = mori.assocIn(state, ['setup', 'message'], message)
  if (icon) {
    state = mori.assocIn(state, ['setup', 'icon'], icon)
  }
  AppStore.emit_change()
}

function setup_wait (action) {
  switch_page('setup')
}

function cave_progress (action) {
  for (let [k, v] of pairs(action.opts)) {
    state = mori.assocIn(state, ['library', 'caves', action.opts.id, k], mori.toClj(v))
  }
  AppStore.emit_change()
}

AppDispatcher.register('app-store', Store.action_listeners(on => {
  on(AppConstants.SETUP_STATUS, setup_status)
  on(AppConstants.SETUP_WAIT, setup_wait)

  on(AppConstants.LIBRARY_FOCUS_PANEL, focus_panel)

  on(AppConstants.NO_STORED_CREDENTIALS, no_stored_credentials)
  on(AppConstants.LOGIN_ATTEMPT, login_attempt)
  on(AppConstants.LOGIN_FAILURE, login_failure)
  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOGOUT, logout)

  on(AppConstants.CAVE_PROGRESS, cave_progress)
}))

Store.subscribe('game-store', (games) => {
  state = mori.assocIn(state, ['library', 'games'], mori.toClj(games))
  AppStore.emit_change()
})

Store.subscribe('collection-store', (collections) => {
  state = mori.assocIn(state, ['library', 'collections'], mori.toClj(collections))
  AppStore.emit_change()
})

module.exports = AppStore
