
import {EventEmitter} from 'events'
import assign from 'object-assign'
import Immutable from 'seamless-immutable'
import app from 'app'
import _ from 'underscore'

import AppDispatcher from '../dispatcher/app_dispatcher'
import AppConstants from '../constants/app_constants'
import AppActions from '../actions/app_actions'
import defer from '../defer'

import config from '../config'
import api from '../api'
import db from '../db'
import main_window from '../main_window'

let CHANGE_EVENT = 'change'

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

let current_user = null

function merge_state (obj) {
  state = state.merge(obj, {deep: true})
}

let AppStore = assign({}, EventEmitter.prototype, {
  listeners: {},

  emit_change: function () {
    this.emit(CHANGE_EVENT)
  },

  add_change_listener: function (name, callback) {
    this.listeners[name] = callback
    this.on(CHANGE_EVENT, callback)
    console.log(`Added listener '${name}', ${this.listenerCount(CHANGE_EVENT)} left`)
  },

  remove_change_listener: function (name) {
    let callback = this.listeners[name]
    if (!callback) {
      console.log(`Can't remove non-listener '${name}'`)
      return
    }
    delete this.listeners[name]
    this.removeListener(CHANGE_EVENT, callback)
    console.log(`Removed listener '${name}', ${this.listenerCount(CHANGE_EVENT)} left`)
  },

  get_state: function () {
    return state
  },

  get_state_json: function () {
    return JSON.stringify(state)
  },

  get_current_user: function () {
    return current_user
  }

})

export default AppStore

function fetch_games () {
  let user = current_user
  let { panel } = state.library

  switch (panel) {

    case 'dashboard': {
      let show_own_games = function () {
        let own_id = state.library.me.id
        db.find({_table: 'games', user_id: own_id}).then(Immutable).then((games) => {
          if (state.library.panel !== 'dashboard') return
          merge_state({library: {games}})
          AppStore.emit_change()
        })
      }

      show_own_games()

      user.my_games().then((res) => {
        return res.games.map((game) => {
          game.user = state.library.me
          return game
        })
      }).then(db.save_games).then(() => show_own_games())
      break
    }

    case 'owned': {
      let show_owned_games = function () {
        db.find({_table: 'download_keys'}).then((keys) => {
          return _.pluck(keys, 'game_id')
        }).then((game_ids) => {
          return db.find({_table: 'games', id: {$in: game_ids}})
        }).then(Immutable).then((games) => {
          if (state.library.panel !== 'owned') return
          merge_state({library: {games}})
          AppStore.emit_change()
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
            AppStore.emit_change()
          })
          break
        }

        case 'installs': {
          db.find_one({_table: 'installs', _id: id}).then((install) => {
            return db.find_one({_table: 'games', id: install.game_id})
          }).then((game) => {
            if (state.library.panel !== `installs/${id}`) return
            merge_state({library: {games: [game]}})
            AppStore.emit_change()
          })
          break
        }

        default: {
          merge_state({library: {games: []}})
          AppStore.emit_change()
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
  AppStore.emit_change()

  fetch_games()
}

function switch_page (page) {
  merge_state({page})
  AppStore.emit_change()
}

function login_key (key) {
  merge_state({login: {loading: true}})
  AppStore.emit_change()

  api.client.login_key(key).then((res) => {
    merge_state({library: {me: res.user}})
    defer(() => AppActions.login_done(key))
  }).catch((errors) => {
    switch_page('login')
    merge_state({login: {errors}})
  }).finally(() => {
    merge_state({login: {loading: false}})
    AppStore.emit_change()
  })
}

function login_with_password (username, password) {
  merge_state({login: {loading: true}})
  AppStore.emit_change()

  api.client.login_with_password(username, password).then((res) => {
    defer(() => {
      AppActions.login_done(res.key.key)
      current_user.me().then((res) => {
        merge_state({library: {me: res.user}})
      })
    })
  }).catch((errors) => {
    merge_state({login: {errors}})
  }).finally(() => {
    merge_state({login: {loading: false}})
    AppStore.emit_change()
  })
}

function login_done (key) {
  config.set('api_key', key)
  current_user = new api.User(api.client, key)
  focus_panel('owned')
  merge_state({login: {errors: null}})
  AppStore.emit_change()

  defer(() => {
    let show_collections = function () {
      db.find({_table: 'collections'}).then((collections) => {
        return _.indexBy(collections, 'id')
      }).then((collections) => {
        merge_state({library: {collections}})
        AppStore.emit_change()
      })
    }

    show_collections()

    current_user.my_collections().then((res) => {
      return res.collections
    }).then(db.save_collections).then(() => show_collections())
  })
}

function setup () {
  let setup = require('../setup').run()
  setup.status((message, icon) => {
    merge_state({setup: {message, icon: icon || state.setup.icon}})
    AppStore.emit_change()
  })
  setup.then(() => {
    AppActions.setup_done()
  }).catch((e) => {
    console.log(`Error in setup: `, e.stack)
    let message = '' + e
    merge_state({setup: {message, icon: 'error'}})
    AppStore.emit_change()
  })
}

AppDispatcher.register((action) => {
  // console.log(action.action_type)

  switch (action.action_type) {

    case AppConstants.SWITCH_PAGE: {
      switch_page(action.page)
      AppStore.emit_change()
      break
    }

    case AppConstants.LIBRARY_VIEW_GAME: {
      merge_state({library: {game: action.game}})
      AppStore.emit_change()
      break
    }

    case AppConstants.LIBRARY_CLOSE_GAME: {
      let library = state.library.without('game')
      state = state.merge({library})
      AppStore.emit_change()
      break
    }

    case AppConstants.LIBRARY_FOCUS_PANEL: {
      focus_window()
      focus_panel(action.panel)
      break
    }

    case AppConstants.FOCUS_WINDOW: {
      focus_window()
      break
    }

    case AppConstants.HIDE_WINDOW: {
      hide_window()
      break
    }

    case AppConstants.LOGIN_WITH_PASSWORD: {
      login_with_password(action.username, action.password)
      break
    }

    case AppConstants.LOGIN_DONE: {
      login_done(action.key)
      break
    }

    case AppConstants.LOGOUT: {
      config.clear('api_key')
      current_user = null
      state = state.merge({library: state.library.without('me')})
      merge_state({page: 'login'})
      AppStore.emit_change()
      defer(() => AppActions.logout_done())
      break
    }

    case AppConstants.SETUP_DONE: {
      merge_state({setup: {message: 'Logging in...', icon: 'heart-filled'}})
      let key = config.get('api_key')
      if (key) {
        login_key(key)
      } else {
        switch_page('login')
      }
      break
    }

    case AppConstants.BOOT: {
      setup()
      break
    }

    case AppConstants.QUIT: {
      app.quit()
      break
    }

    case AppConstants.INSTALL_PROGRESS: {
      let installs = { [action.opts.id]: action.opts }
      merge_state({library: {installs}})
      AppStore.emit_change()
      break
    }

  }
})

