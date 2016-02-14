
import {indexBy, pluck, throttle} from 'underline'

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let Logger = require('../util/log').Logger
let log = require('../util/log')('game-store')
let opts = {logger: new Logger({sinks: {console: !!process.env.LET_ME_IN}})}

let db = require('../util/db')

let deep = require('deep-diff')

let electron = require('electron')

let state = {}

let GameStore = Object.assign(new Store('game-store'), {
  get_state: () => state
})

function cache_games (key, games) {
  let games_by_id = games::indexBy('id')
  let new_state = {[key]: games_by_id}
  let old_state = {[key]: state[key]}
  let state_diff = deep.diff(old_state, new_state)

  if (!state_diff) return
  AppActions.game_store_diff(state_diff)

  state[key] = games_by_id
  GameStore.emit_change()
}

async function fetch_games (payload) {
  let path = payload.path
  let user = CredentialsStore.get_current_user()

  log(opts, `fetch_games(${payload.path})`)
  if (!user) {
    log(opts, `user not there yet, ignoring`)
    return
  }

  if (path === 'owned') {
    cache_owned_games()
    await fetch_owned_keys()
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
      if (id === 'empty') return

      try {
        await fetch_collection_games(parseInt(id, 10), {_fetched_at: new Date()})
      } catch (e) {
        console.log(`while fetching collection games: ${e.stack || e}`)
      }
    } else if (type === 'games') {
      fetch_single_game(parseInt(id, 10))
    } else if (type === 'caves') {
      cache_cave_game(id)
    }
  }
}

async function fetch_single_game (id) {
  log(opts, `fetching single game ${id}`)

  let user = CredentialsStore.get_current_user()
  let game = (await user.game(id)).game
  await db.save_games([game])
  AppActions.games_fetched([id])
}

async function fetch_collection_games (id, ctx) {
  pre: { // eslint-disable-line
    typeof id === 'number'
    typeof ctx === 'object'
    ctx._fetched_at instanceof Date
  }

  let {_fetched_at, page = 1, game_ids = []} = ctx

  if (page === 1) {
    await cache_collection_games(id)
  }

  log(opts, `fetching page ${page} of collection ${id}`)

  let user = CredentialsStore.get_current_user()

  let res = await user.collection_games(id, page)
  let total_items = res.total_items
  let fetched = res.per_page * page
  game_ids = game_ids.concat(res.games::pluck('id'))

  await db.save_games(res.games)
  await db.update({_table: 'collections', id}, {
    $addToSet: { game_ids: { $each: game_ids } }
  })
  await cache_collection_games(id)
  AppActions.games_fetched(game_ids)

  if (fetched < total_items) {
    await fetch_collection_games(id, {_fetched_at, page: page + 1, game_ids})
  } else {
    await db.update({_table: 'collections', id}, {
      $set: { game_ids, _fetched_at }
    })
    await cache_collection_games(id)
  }
}

async function fetch_owned_keys (page) {
  if (typeof page === 'undefined') {
    page = 1
  }

  log(opts, `fetch_owned_keys(${page})`)

  let user = CredentialsStore.get_current_user()
  let res = await user.my_owned_keys({page})
  let keys = res.owned_keys

  if (keys.length) {
    fetch_owned_keys(page + 1)
  }

  await db.save_download_keys(keys)
  await cache_owned_games()
}

async function fetch_search (payload) {
  let query = payload.query
  if (query === '') {
    log(opts, 'empty fetch_search query')
    AppActions.search_fetched(query, [], {})
    return
  }
  log(opts, `fetch_search(${query})`)
  let user = CredentialsStore.get_current_user()
  try {
    let res = await user.search(query)
    let game_ids = res.games::pluck('id')
    let games = {}
    for (let game of res.games) {
      games[game.id] = game
    }

    await db.save_games(res.games)
    AppActions.search_fetched(query, game_ids, games)
  } catch (e) {
    console.log(`while fetching search games: ${e.stack || e}`)
  }
}

/* Cache API results in DB */

async function cache_owned_games () {
  let keys = await db.find({_table: 'download_keys'})
  let gids = keys::pluck('game_id')
  let games = await db.find({_table: 'games', id: {$in: gids}})
  cache_games('owned', games)
}

async function cache_dashboard_games () {
  let own_id = CredentialsStore.get_me().id
  let games = await db.find({_table: 'games', user_id: own_id})
  cache_games('dashboard', games)
}

async function cache_caved_games () {
  let caves = await db.find({_table: 'caves'})
  let gids = caves::pluck('game_id')
  let games = await db.find({_table: 'games', id: {$in: gids}})
  cache_games('caved', games)
}

async function cache_cave_game (cave_id) {
  let cave = await db.find_cave(cave_id)
  let game = await db.find_game(cave.game_id)
  cache_games(`caves/${cave_id}`, [game])
}

async function cache_collection_games (collection_id) {
  let collection = await db.find_collection(collection_id)
  if (!collection) return

  let gids = collection.game_ids || []
  let games = await db.find({_table: 'games', id: {$in: gids}})
  cache_games(`collections/${collection_id}`, games)
  AppActions.games_fetched(games::pluck('id'))
}

// TODO: Move browse_game somewhere else

async function browse_game (payload) {
  let game_id = payload.game_id
  let game = await db.find_game(game_id)
  electron.shell.openExternal(game.url)
}

let fetch_caved_games = (() => {
  fetch_games({path: 'caved'})
})::throttle(250, true)

function implode_app () {
  state = {}
  GameStore.emit_change()
}

let cached_caves = {}

AppDispatcher.register('game-store', Store.action_listeners(on => {
  on(AppConstants.LOGOUT, (payload) => {
    // clear cache
    cached_caves = {}
    state = {}
    GameStore.emit_change()
  })

  on(AppConstants.FETCH_GAMES, fetch_games)
  on(AppConstants.FETCH_SEARCH, fetch_search)
  on(AppConstants.CAVE_PROGRESS, (payload) => {
    let id = payload.opts.id

    if (!cached_caves[id]) {
      cached_caves[id] = true
      fetch_caved_games()
    }
  })

  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, (payload) => {
    fetch_caved_games()
  })

  on(AppConstants.BROWSE_GAME, browse_game)
  on(AppConstants.IMPLODE_APP, implode_app)
}))

module.exports = GameStore
