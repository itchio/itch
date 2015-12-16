'use strict'

let deep_assign = require('deep-assign')
let Promise = require('bluebird')
let pluck = require('underscore').pluck

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
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

async function cache_owned_games () {
  let keys = await db.find({_table: 'download_keys'})
  let gids = pluck(keys, 'game_id')
  let games = await db.find({_table: 'games', id: {$in: gids}})
  merge_state({owned: games})
}

async function cache_dashboard_games () {
  let own_id = CredentialsStore.get_me().id
  let games = await db.find({_table: 'games', user_id: own_id})
  merge_state({dashboard: games})
}

async function cache_caved_games () {
  let caves = await db.find({_table: 'caves'})
  let gids = pluck(caves, 'game_id')
  state.caved = await db.find({_table: 'games', id: {$in: gids}})
  GameStore.emit_change()
}

async function cache_collection_games (id) {
  let collection = await db.find_one({_table: 'collections', id})
  let gids = collection.game_ids || []
  let games = await db.find({_table: 'games', id: {$in: gids}})
  merge_state({[`collections/${id}`]: games})
  AppActions.games_fetched(pluck(games, 'id'))
}

async function fetch_single_game (id) {
  let user = CredentialsStore.get_current_user()
  let game = (await user.game(id)).game
  console.log(`got single game: ${JSON.stringify(game)}`)
  await db.save_games([game])
  AppActions.games_fetched([id])
}

async function fetch_collection_games (id, page, game_ids) {
  if (typeof page === 'undefined') {
    page = 1
  }
  if (typeof game_ids === 'undefined') {
    game_ids = []
  }

  cache_collection_games(id)

  let user = CredentialsStore.get_current_user()

  let res = await user.collection_games(id, page)
  let total_items = res.total_items
  let fetched = res.per_page * page
  game_ids = game_ids.concat(pluck(res.games, 'id'))

  await db.save_games(res.games)
  await db.update({_table: 'collections', id}, {
    $addToSet: { game_ids: { $each: game_ids } }
  })
  cache_collection_games(id)
  AppActions.games_fetched(game_ids)

  if (fetched < total_items) {
    await fetch_collection_games(id, page + 1, game_ids)
  } else {
    await db.update({_table: 'collections', id}, {
      $set: { game_ids }
    })
  }
}

async function cache_cave_game (_id) {
  let cave = await db.find_one({_table: 'caves', _id})
  let game = await db.find_one({_table: 'games', id: cave.game_id})
  merge_state({[`caves/${_id}`]: [game]})
}

async function fetch_games (action) {
  let path = action.path
  let user = CredentialsStore.get_current_user()

  if (path === 'owned') {
    cache_owned_games()

    await Promise.resolve([
      user.my_owned_keys().then((res) => res.owned_keys),
      user.my_claimed_keys().then((res) => res.claimed_keys)
    ]).map((keys) => {
      db.save_download_keys(keys).then(() => cache_owned_games())
    })
  } else if (path === 'caved') {
    cache_caved_games()
  } else if (path === 'dashboard') {
    cache_dashboard_games()

    let me = CredentialsStore.get_me()
    let games = (await user.my_games()).games.map((game) => {
      return Object.assign({}, game, {user: me})
    })
    await db.save_games(games)
    cache_dashboard_games()
  } else {
    let path_tokens = path.split('/')
    let type = path_tokens[0]
    let id = path_tokens[1]

    if (type === 'collections') {
      fetch_collection_games(parseInt(id, 10))
    } else if (type === 'games') {
      fetch_single_game(parseInt(id, 10))
    } else if (type === 'caves') {
      cache_cave_game(id)
    }
  }
}

let cached_caves = {}

AppDispatcher.register('game-store', Store.action_listeners(on => {
  on(AppConstants.LOGOUT, (action) => {
    // clear cache
    cached_caves = {}
    state = {}
    GameStore.emit_change()
  })

  on(AppConstants.FETCH_GAMES, fetch_games)
  on(AppConstants.CAVE_PROGRESS, (action) => {
    let id = action.opts.id

    if (!cached_caves[id]) {
      cached_caves[id] = true
      fetch_games({path: 'caved'})
    }
  })

  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, (action) => {
    fetch_games({path: 'caved'})
  })
}))

module.exports = GameStore
