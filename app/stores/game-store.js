'use nodent';'use strict'
let deep_assign = require('deep-assign')
let Promise = require('bluebird')
let pluck = require('underscore').pluck

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')

let db = require('../util/db')

let state = {}

let GameStore = Object.assign(new Store('game-store'), {
  get_state: () => state
})

function merge_state (obj) {
  deep_assign(state, obj)
  GameStore.emit_change()
}

function cache_owned_games () {
  return db.find({_table: 'download_keys'}).then((keys) => {
    return pluck(keys, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then((games) => {
    merge_state({owned: games})
  })
}

function cache_dashboard_games () {
  let own_id = CredentialsStore.get_me().id
  return db.find({_table: 'games', user_id: own_id}).then((games) => {
    merge_state({dashboard: games})
  })
}

function cache_caved_games () {
  return db.find({_table: 'caves'}).then((caves) => {
    return pluck(caves, 'game_id')
  }).then((game_ids) => {
    return db.find({_table: 'games', id: {$in: game_ids}})
  }).then((games) => {
    merge_state({caved: games})
  })
}

function cache_collection_games (id) {
  return db.find_one({_table: 'collections', id}).then((collection) => {
    return db.find({_table: 'games', id: {$in: collection.game_ids || []}})
  }).then((games) => {
    merge_state({[`collections/${id}`]: games})
  })
}

function fetch_collection_games (id, page, game_ids) {
  if (typeof page === 'undefined') {
    page = 1
  }
  if (typeof game_ids === 'undefined') {
    game_ids = []
  }

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

function cache_cave_game (id) {
  db.find_one({_table: 'caves', _id: id}).then((cave) => {
    return db.find_one({_table: 'games', id: cave.game_id})
  }).then((game) => {
    merge_state({[`caves/${id}`]: [game]})
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
  } else if (path === 'caved') {
    return cache_caved_games()
  } else if (path === 'dashboard') {
    cache_dashboard_games()

    return user.my_games().then((res) => {
      return res.games.map((game) => {
        return Object.assign({}, game, {user: CredentialsStore.get_me()})
      })
    }).then(db.save_games).then(() => cache_dashboard_games())
  } else {
    let [type, id] = path.split('/')
    if (type === 'collections') {
      return fetch_collection_games(parseInt(id, 10))
    } else if (type === 'caves') {
      cache_cave_game(id)
    }
  }
}

let cached_caves = {}

AppDispatcher.register('game-store', Store.action_listeners(on => {
  on(AppConstants.FETCH_GAMES, fetch_games)
  on(AppConstants.CAVE_PROGRESS, (action) => {
    let id = action.opts.id

    if (!cached_caves[id]) {
      cached_caves[id] = true
      fetch_games({path: 'caved'})
    }
  })
}))

module.exports = GameStore
