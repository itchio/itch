
import {filter, where, indexBy, throttle, debounce} from 'underline'

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let Logger = require('../util/log').Logger
let log = require('../util/log')('game-store')
let opts = {logger: new Logger({sinks: {console: !!process.env.LET_ME_IN}})}

let deep = require('deep-diff')

let electron = require('electron')

let market = require('../util/market')

let state = {}

let GameStore = Object.assign(new Store('game-store'), {
  get_state: () => state
})

async function fetch_games (payload) {
  let path = payload.path
  let user = CredentialsStore.get_current_user()

  log(opts, `fetch_games(${payload.path})`)
  if (!user) {
    log(opts, `user not there yet, ignoring`)
    return
  }

  if (path === 'owned') {
    market.fetch_owned_keys(commit_owned_games)
  } else if (path === 'caved') {
    commit_caved_games()
  } else if (path === 'dashboard') {
    market.fetch_dashboard_games(commit_dashboard_games)
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
      commit_cave_game(id)
    }
  }
}

async function fetch_single_game (id) {
  // log(opts, `fetching single game ${id}`)
  //
  // let user = CredentialsStore.get_current_user()
  // let game = (await user.game(id)).game
  // save_games([game])
  // AppActions.games_fetched([id])
}

async function fetch_collection_games (id, ctx) {
  // pre: { // eslint-disable-line
  //   typeof id === 'number'
  //   typeof ctx === 'object'
  //   ctx._fetched_at instanceof Date
  // }
  //
  // let {_fetched_at, page = 1, game_ids = []} = ctx
  //
  // if (page === 1) {
  //   await cache_collection_games(id)
  // }
  //
  // log(opts, `fetching page ${page} of collection ${id}`)
  //
  // let user = CredentialsStore.get_current_user()
  //
  // let res = await user.collection_games(id, page)
  // let total_items = res.total_items
  // let fetched = res.per_page * page
  // game_ids = game_ids.concat(res.games::pluck('id'))
  //
  // save_games(res.games)
  // save_collection_games(id, game_ids, true)
  //
  // await cache_collection_games(id)
  // AppActions.games_fetched(game_ids)
  //
  // if (fetched < total_items) {
  //   await fetch_collection_games(id, {_fetched_at, page: page + 1, game_ids})
  // } else {
  //   save_collection_games(id, game_ids, true)
  //   await cache_collection_games(id)
  // }
}

async function fetch_search (payload) {
  // let query = payload.query
  // if (query === '') {
  //   log(opts, 'empty fetch_search query')
  //   AppActions.search_fetched(query, [], {})
  //   return
  // }
  // log(opts, `fetch_search(${query})`)
  // let user = CredentialsStore.get_current_user()
  // try {
  //   let res = await user.search(query)
  //   let game_ids = res.games::pluck('id')
  //   let games = {}
  //   for (let game of res.games) {
  //     games[game.id] = game
  //   }
  //
  //   save_games(res.games)
  //   AppActions.search_fetched(query, game_ids, games)
  // } catch (e) {
  //   console.log(`while fetching search games: ${e.stack || e}`)
  // }
}

async function commit_dashboard_games () {
  let me = CredentialsStore.get_me()
  console.log(`me = ${JSON.stringify(me, null, 2)}`)

  let games = market.get_entities('games')
  console.log(`1st game = ${JSON.stringify(games[Object.keys(games)[0]], null, 2)}`)

  games = market.get_entities('games')::where({user: me.id})
  commit_games('dashboard', games)
}

async function commit_owned_games () {
  let keys = market.get_entities('download_keys')
  let gids = keys::indexBy('game')
  let games = market.get_entities('games')::filter((g) => gids[g.id])
  commit_games('owned', games)
}

async function commit_caved_games () {
  let caves = await db.find({_table: 'caves'})
  let gids = caves::indexBy('game_id')
  let games = market.get_entities('games')::filter((g) => gids[g.id])
  cache_games('caved', games)
}

async function commit_cave_game (cave_id) {
  // let cave = await db.find_cave(cave_id)
  // let game = await db.find_game(cave.game_id)
  // cache_games(`caves/${cave_id}`, [game])
}

async function commit_collection_games (collection_id) {
  // let collection = await db.find_collection(collection_id)
  // if (!collection) return
  //
  // let gids = collection.game_ids || []
  // let games = find_games(gids)
  // cache_games(`collections/${collection_id}`, games)
  // AppActions.games_fetched(games::pluck('id'))
}

function commit_games (key, games) {
  let games_by_id = games::indexBy('id')
  let new_state = {[key]: games_by_id}
  let old_state = {[key]: state[key]}
  let state_diff = deep.diff(old_state, new_state)

  if (!state_diff) return
  AppActions.game_store_diff(state_diff)

  state[key] = games_by_id
  GameStore.emit_change()
}

// TODO: Move browse_game somewhere else

async function browse_game (payload) {
  let game_id = payload.game_id
  let game = market.get_entities('games')[game_id]
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
  on(AppConstants.FETCH_SEARCH, fetch_search::debounce(150))
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
