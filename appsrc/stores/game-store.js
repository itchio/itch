
import { filter, where, indexBy, throttle, debounce, pluck } from 'underline'

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
let fetch = require('../util/fetch')

let state = {}

let GameStore = Object.assign(new Store('game-store'), {
  get_state: () => state
})

function fetch_games (payload) {
  let path = payload.path
  let user = CredentialsStore.get_current_user()

  log(opts, `fetch_games(${payload.path})`)
  if (!user) {
    log(opts, `user not there yet, ignoring`)
    return
  }

  if (path === 'owned') {
    fetch.owned_keys(market, commit_owned_games)
  } else if (path === 'caved') {
    commit_caved_games()
  } else if (path === 'dashboard') {
    fetch.dashboard_games(market, commit_dashboard_games)
  } else {
    let path_tokens = path.split('/')
    let type = path_tokens[0]
    let id = path_tokens[1]

    if (type === 'collections') {
      if (id === 'empty') return

      try {
        let collection_id = parseInt(id, 10)
        fetch.collection_games(market, collection_id, () => commit_collection_games(collection_id))
      } catch (e) {
        console.log(`while fetching collection games: ${e.stack || e}`)
      }
    } else if (type === 'games') {
      fetch.single_game(market, parseInt(id, 10), () => null)
    } else if (type === 'caves') {
      commit_cave_game(id)
    }
  }
}

function fetch_search (payload) {
  let query = payload.query
  if (query === '') {
    log(opts, 'empty fetch_search query')
    commit_games('search', {})
    return
  }

  log(opts, `fetch_search(${query})`)
  fetch.search(market, query, (games) => commit_games('search', games))
}

function commit_dashboard_games () {
  let me = CredentialsStore.get_me()
  let games = market.get_entities('games')::where({user_id: me.id})
  commit_games('dashboard', games)
}

function commit_owned_games () {
  let keys = market.get_entities('download_keys')
  let gids = keys::indexBy('game_id')
  let games = market.get_entities('games')::filter((g) => gids[g.id])
  commit_games('owned', games)
}

function commit_caved_games () {
  let caves = market.get_entities('caves')
  let gids = caves::indexBy('game_id')
  let games = market.get_entities('games')::filter((g) => gids[g.id])
  commit_games('caved', games)
}

function commit_cave_game (cave_id) {
  let cave = market.get_entities('caves')[cave_id]
  let game = market.get_entities('games')[cave.game_id]
  commit_games(`caves/${cave_id}`, {[game.id]: game})
}

function commit_collection_games (collection_id) {
  let collection = market.get_entities('collections')[collection_id]
  if (!collection) return

  let gids = (collection.game_ids || [])::indexBy((id) => id)
  let games = market.get_entities('games')::filter((g) => gids[g.id])
  commit_games(`collections/${collection_id}`, games)
  AppActions.games_fetched(games::pluck('id'))
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
  electron.shell.openExternal(payload.url)
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
    let id = payload.data.id

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
