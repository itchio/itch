
import {filter, where, indexBy, throttle, debounce, each} from 'underline'
import {assocIn} from 'grovel'

import Store from './store'
import CredentialsStore from './credentials-store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'

import {Logger} from '../util/log'
import mklog from '../util/log'
const log = mklog('game-store')
const opts = {logger: new Logger({sinks: {console: (process.env.LET_ME_IN === '1')}})}

import deep from 'deep-diff'

import electron from 'electron'

import market from '../util/market'
import fetch from '../util/fetch'

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

async function fetch_search (payload) {
  let query = payload.query
  if (query === '') {
    log(opts, 'empty fetch_search query')
    commit_games('search', {})
    return
  }

  log(opts, `fetch_search(${query})`)
  const games = await fetch.search(query)
  commit_games('search', games)
  AppActions.search_fetched(query)
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

function record_game_interaction (payload) {
  const {last_interacted_at = Date.now()} = payload
  const game = market.get_entities('games')[payload.game_id]
  const updated_game = Object.assign({}, game, {last_interacted_at})
  market.save_all_entities({
    entities: {
      games: {
        [payload.game_id]: updated_game
      }
    }
  })

  // TODO: move to a structure where we have all games in a map somewhere (straight
  // from market), and all tabs are game_id lists, pre-sorted
  let new_state = state
  state::each((games, key) => {
    games::each((game, game_id) => {
      new_state = new_state::assocIn([key, game_id, updated_game])
    })
    commit_games(key, new_state[key])
  })
}

AppDispatcher.register('game-store', Store.action_listeners(on => {
  on(AppConstants.RECORD_GAME_INTERACTION, record_game_interaction)
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

export default GameStore
