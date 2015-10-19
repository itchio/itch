import Immutable from 'seamless-immutable'
import {pluck} from 'underscore'

import Store from './store'
import CredentialsStore from './credentials-store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

import db from '../util/db'

let state = Immutable({})

let GameStore = Object.assign(new Store(), {
  get_state: () => state
})

function merge_state (obj) {
  state = state.merge(obj, {deep: true})
  GameStore.emit_change()
}

function cache_owned_games () {
  db.find({_table: 'download_keys'}).then((keys) => {
    return pluck(keys, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then(Immutable).then((games) => {
    merge_state({owned: games})
  })
}

function cache_dashboard_games () {
  let own_id = CredentialsStore.get_me().id
  db.find({_table: 'games', user_id: own_id}).then(Immutable).then((games) => {
    merge_state({dashboard: games})
  })
}

function cache_installed_games () {
  db.find({_table: 'installs'}).then((installs) => {
    return pluck(installs, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then((games) => {
    merge_state({installed: games})
  })
}

function cache_collection_games (id) {
  db.find_one({_table: 'collections', id}).then((collection) => {
    return db.find({_table: 'games', id: {$in: collection.game_ids}})
  }).then((games) => {
    merge_state({[`collections/${id}`]: games})
  })
}

function cache_install_game (id) {
  db.find_one({_table: 'installs', _id: id}).then((install) => {
    return db.find_one({_table: 'games', id: install.game_id})
  }).then((game) => {
    merge_state({[`installs/${id}`]: [game]})
  })
}

function fetch_games (action) {
  let {path} = action
  let user = CredentialsStore.get_current_user()

  if (path === 'owned') {
    cache_owned_games()

    for (let promise of [
      user.my_owned_keys().then((res) => res.owned_keys),
      user.my_claimed_keys().then((res) => res.claimed_keys)
    ]) {
      promise.then(db.save_download_keys).then(() => cache_owned_games())
    }
  } else if (path === 'installed') {
    cache_installed_games()
  } else if (path === 'dashboard') {
    cache_dashboard_games()

    user.my_games().then((res) => {
      return res.games.map((game) => {
        return game.merge({user: CredentialsStore.get_me()})
      })
    }).then(db.save_games).then(() => cache_dashboard_games())
  } else {
    let [type, id] = path.split('/')
    if (type === 'collections') {
      cache_collection_games(parseInt(id, 10))
    } else if (type === 'installs') {
      cache_install_game(id)
    }
  }
}

GameStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.FETCH_GAMES, fetch_games)
  on(AppConstants.INSTALL_PROGRESS, () => {
    fetch_games({path: 'installed'})
  })
}))

export default GameStore
