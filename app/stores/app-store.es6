import Immutable from 'seamless-immutable'
import app from 'app'
import {indexBy} from 'underscore'

import Store from './store'
import GameStore from './game-store'
import CredentialsStore from './credentials-store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

import db from '../util/db'

let state = Immutable({
  page: 'setup',

  library: {
    game: null,
    games: {},
    panel: null,
    collections: {},
    installs: {}
  },

  login: {
    loading: false,
    errors: null
  },

  setup: {
    message: 'Checking dependencies',
    icon: 'settings'
  }
})

let AppStore = Object.assign(new Store(), {
  get_state: function () {
    return JSON.stringify(state)
  }
})

function merge_state (obj) {
  state = state.merge(obj, {deep: true})
  AppStore.emit_change()
}

function focus_panel (panel) {
  merge_state({
    page: 'library',
    library: { panel }
  })

  setImmediate(() => AppActions.fetch_games(panel))
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

  AppDispatcher.wait_for(CredentialsStore).then(_ => {
    focus_panel('owned')

    setImmediate(_ => {
      let show_collections = function () {
        db.find({_table: 'collections'}).then((collections) => {
          return indexBy(collections, 'id')
        }).then((collections) => {
          merge_state({library: {collections}})
          Object.keys(collections).forEach((cid) =>
            AppActions.fetch_games(`collections/${cid}`)
          )
        })
      }

      show_collections()

      CredentialsStore.get_current_user().my_collections().then((res) => {
        return res.collections
      }).then(db.save_collections).then(() => show_collections())

      AppActions.fetch_games('dashboard')
    })
  })
}

function logout () {
  state = state.merge({library: state.library.without('me')})
  merge_state({page: 'login'})
}

function setup_status (action) {
  console.log(`Got setup_status: ${JSON.stringify(action, null, 2)}`)
  let {message, icon = state.setup.icon} = action
  merge_state({setup: {message, icon}})
}

AppStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.SETUP_STATUS, setup_status)

  on(AppConstants.LIBRARY_FOCUS_PANEL, action => {
    setImmediate(AppActions.focus_window)
    focus_panel(action.panel)
  })

  on(AppConstants.NO_STORED_CREDENTIALS, no_stored_credentials)
  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.LOGIN_FAILURE, login_failure)
  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOGOUT, logout)

  on(AppConstants.QUIT, _ => app.quit())

  on(AppConstants.INSTALL_PROGRESS, action => {
    let installs = { [action.opts.id]: action.opts }
    merge_state({library: {installs}})
    setImmediate(() => AppActions.fetch_games('installed'))
  })
}))

GameStore.add_change_listener('app-store', () => {
  let games = GameStore.get_state()
  merge_state({library: {games}})
})

export default AppStore
