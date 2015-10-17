import Immutable from 'seamless-immutable'
import app from 'app'
import {pluck, indexBy} from 'underscore'

import Store from './store'
import CredentialsStore from './credentials-store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import defer from '../util/defer'

import setup from '../util/setup'
import db from '../util/db'
import main_window from '../ui/main-window'

let state = Immutable({
  page: 'setup',

  library: {
    me: null,
    game: null,
    games: [],
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
    icon: 'settings',
    error: false
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

function fetch_games () {
  let user = CredentialsStore.get_current_user()
  let {panel} = state.library

  switch (panel) {

    case 'dashboard': {
      let show_own_games = function () {
        let own_id = CredentialsStore.get_me().id
        db.find({_table: 'games', user_id: own_id}).then(Immutable).then((games) => {
          if (state.library.panel !== 'dashboard') return
          merge_state({library: {games}})
        })
      }

      show_own_games()

      user.my_games().then((res) => {
        return res.games.map((game) => {
          return game.merge({user: CredentialsStore.get_me()})
        })
      }).then(db.save_games).then(() => show_own_games())
      break
    }

    case 'owned': {
      let show_owned_games = function () {
        db.find({_table: 'download_keys'}).then((keys) => {
          return pluck(keys, 'game_id')
        }).then((game_ids) => {
          return db.find({_table: 'games', id: {$in: game_ids}})
        }).then(Immutable).then((games) => {
          if (state.library.panel !== 'owned') return
          merge_state({library: {games}})
        })
      }

      show_owned_games()

      for (let promise of [
        user.my_owned_keys().then((res) => res.owned_keys),
        user.my_claimed_keys().then((res) => res.claimed_keys)
      ]) {
        promise.then(db.save_download_keys).then(() => show_owned_games())
      }

      break
    }

    default: {
      let [type, id] = panel.split('/')
      switch (type) {
        case 'collections': {
          let collection = state.library.collections[id]
          db.find({_table: 'games', id: {$in: collection.game_ids}}).then((games) => {
            if (state.library.panel !== `collections/${id}`) return
            merge_state({library: {games}})
          })
          break
        }

        case 'installs': {
          db.find_one({_table: 'installs', _id: id}).then((install) => {
            return db.find_one({_table: 'games', id: install.game_id})
          }).then((game) => {
            if (state.library.panel !== `installs/${id}`) return
            merge_state({library: {games: [game]}})
          })
          break
        }

        default: {
          merge_state({library: {games: []}})
          break
        }
      }
      break
    }
  }
}

function focus_window () {
  main_window.show()
}

function hide_window () {
  main_window.hide()
}

function focus_panel (panel) {
  merge_state({
    page: 'library',
    library: {
      panel,
      games: []
    }
  })

  fetch_games()
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

function authenticated (action) {
  merge_state({login: {loading: false, errors: null}})

  AppDispatcher.wait_for(CredentialsStore).then(_ => {
    focus_panel('owned')

    defer(() => {
      let show_collections = function () {
        db.find({_table: 'collections'}).then((collections) => {
          return indexBy(collections, 'id')
        }).then((collections) => {
          merge_state({library: {collections}})
        })
      }

      show_collections()

      CredentialsStore.get_current_user().my_collections().then((res) => {
        return res.collections
      }).then(db.save_collections).then(() => show_collections())
    })
  })
}

function logout () {
  state = state.merge({library: state.library.without('me')})
  merge_state({page: 'login'})
}

function run_setup () {
  let onstatus = (message, icon) => {
    merge_state({setup: {message, icon: icon || state.setup.icon}})
  }

  let task = setup.run({onstatus})

  return task.then(() => {
    merge_state({setup: {message: 'Logging in...', icon: 'heart-filled'}})
  }).catch((e) => {
    console.log(`Error in setup: `, e.stack)
    let message = '' + e
    merge_state({setup: {message, icon: 'error'}})
  })
}

AppStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.BOOT, run_setup)

  on(AppConstants.LIBRARY_FOCUS_PANEL, action => {
    focus_window()
    focus_panel(action.panel)
  })

  // TODO move to main-window
  on(AppConstants.FOCUS_WINDOW, focus_window)
  on(AppConstants.HIDE_WINDOW, hide_window)

  on(AppConstants.LOGIN_WITH_PASSWORD, login_with_password)
  on(AppConstants.LOGIN_FAILURE, login_failure)
  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOGOUT, logout)

  on(AppConstants.QUIT, _ => app.quit())

  // TODO not even sure
  on(AppConstants.INSTALL_PROGRESS, action => {
    let installs = { [action.opts.id]: action.opts }
    merge_state({library: {installs}})
  })
}))

export default AppStore
