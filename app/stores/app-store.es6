
import deep_assign from 'deep-assign'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import defer from '../util/defer'

let state = {
  page: 'setup',

  library: {
    games: {},
    panel: '',
    collections: {},
    installs: {}
  },

  login: {
    loading: false,
    errors: []
  },

  setup: {
    message: 'Checking dependencies',
    icon: 'settings'
  }
}

let AppStore = Object.assign(new Store('app-store', 'renderer'), {
  get_state: function () {
    return state
  }
})

function merge_state (obj) {
  state = deep_assign({}, state, obj)
  AppStore.emit_change()
}

function focus_panel (action) {
  let {panel} = action
  merge_state({
    page: 'library',
    library: { panel }
  })

  defer(() => {
    AppActions.focus_window()
    AppActions.fetch_games(panel)
  })
}

function switch_page (page) {
  merge_state({page})
}

function login_with_password (action) {
  merge_state({login: {loading: true}})
}

function login_failure (action) {
  let {errors} = action
  merge_state({login: {loading: false, errors}})
  switch_page('login')
}

function no_stored_credentials () {
  switch_page('login')
}

function authenticated (action) {
  merge_state({login: {loading: false, errors: null}})
  focus_panel({panel: 'owned'})
  defer(() => {
    AppActions.fetch_games('dashboard')
  })
}

function logout () {
  switch_page('login')
}

function setup_status (action) {
  let {message, icon = state.setup.icon} = action
  merge_state({setup: {message, icon}})
}

function install_progress (action) {
  let installs = { [action.opts.id]: action.opts }
  merge_state({library: {installs}})
}

AppDispatcher.register('app-store', Store.action_listeners(on => {
  on(AppConstants.SETUP_STATUS, setup_status)

  on(AppConstants.LIBRARY_FOCUS_PANEL, focus_panel)

  on(AppConstants.NO_STORED_CREDENTIALS, no_stored_credentials)
  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.LOGIN_FAILURE, login_failure)
  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOGOUT, logout)

  on(AppConstants.INSTALL_PROGRESS, install_progress)
}))

Store.subscribe('game-store', (games) =>
  merge_state({library: {games}})
)
Store.subscribe('collection-store', (collections) =>
  merge_state({library: {collections}})
)

export default AppStore
