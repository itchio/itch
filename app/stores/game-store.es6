import Immutable from 'seamless-immutable'
import Promise from 'bluebird'
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
  return db.find({_table: 'download_keys'}).then((keys) => {
    return pluck(keys, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then(Immutable).then((games) => {
    merge_state({owned: games})
  })
}

function cache_dashboard_games () {
  let own_id = CredentialsStore.get_me().id
  return db.find({_table: 'games', user_id: own_id}).then(Immutable).then((games) => {
    merge_state({dashboard: games})
  })
}

function cache_installed_games () {
  return db.find({_table: 'installs'}).then((installs) => {
    return pluck(installs, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then((games) => {
    merge_state({installed: games})
  })
}

function cache_collection_games (id) {
  return db.find_one({_table: 'collections', id}).then((collection) => {
    return db.find({_table: 'games', id: {$in: collection.game_ids}})
  }).then((games) => {
    merge_state({[`collections/${id}`]: games})
  })
}

function fetch_collection_games (id, page = 1, game_ids = []) {
  cache_collection_games(id)

  let user = CredentialsStore.get_current_user()
  let fetched = 0
  let total_items = 0

  return user.collection_games(id, page).then((res) => {
    total_items = res.total_items
    fetched = res.per_page * page
    game_ids = game_ids.concat(pluck(res.games, 'id'))
    return db.save_games(res.games)
  }).then(() => {
    return db.update({_table: 'collections', id}, {
      $addToSet: { game_ids: { $each: game_ids } }
    })
  }).then(() => {
    cache_collection_games(id)
    if (fetched < total_items) {
      return fetch_collection_games(id, page + 1, game_ids)
    } else {
      return db.update({_table: 'collections', id}, {
        $set: { game_ids }
      })
    }
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
    return Promise.resolve([
      user.my_owned_keys().then((res) => res.owned_keys),
      user.my_claimed_keys().then((res) => res.claimed_keys)
    ]).map((keys) => {
      db.save_download_keys(keys).then(() => cache_owned_games())
    })
  } else if (path === 'installed') {
    return cache_installed_games()
  } else if (path === 'dashboard') {
    cache_dashboard_games()

    return user.my_games().then((res) => {
      return res.games.map((game) => {
        return game.merge({user: CredentialsStore.get_me()})
      })
    }).then(db.save_games).then(() => cache_dashboard_games())
  } else {
    let [type, id] = path.split('/')
    if (type === 'collections') {
      return fetch_collection_games(parseInt(id, 10))
    } else if (type === 'installs') {
      cache_install_game(id)
    }
  }
}

GameStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.FETCH_GAMES, fetch_games)
  on(AppConstants.INSTALL_PROGRESS, () => {
    return fetch_games({path: 'installed'})
  })
}))

export default GameStore
