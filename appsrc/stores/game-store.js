
let _ = require('underscore')

let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let Logger = require('../util/log').Logger
let log = require('../util/log')('game-store')
let opts = {logger: new Logger()}

let db = require('../util/db')

let deep = require('deep-diff')

let electron = require('electron')

let state = {}

let GameStore = Object.assign(new Store('game-store'), {
  get_state: () => state
})

function cache_games (key, games) {
  let games_by_id = _.indexBy(games, 'id')
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
        fetch_collection_games(parseInt(id, 10), new Date())
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

async function fetch_collection_games (id, _fetched_at, page, game_ids) {
  if (typeof page === 'undefined') {
    cache_collection_games(id)
    page = 1
  }
  if (typeof game_ids === 'undefined') {
    game_ids = []
  }

  log(opts, `fetching page ${page} of collection ${id}`)

  let user = CredentialsStore.get_current_user()

  let res = await user.collection_games(id, page)
  let total_items = res.total_items
  let fetched = res.per_page * page
  game_ids = game_ids.concat(_.pluck(res.games, 'id'))

  await db.save_games(res.games)
  await db.update({_table: 'collections', id}, {
    $addToSet: { game_ids: { $each: game_ids } }
  })
  cache_collection_games(id)
  AppActions.games_fetched(game_ids)

  if (fetched < total_items) {
    await fetch_collection_games(id, _fetched_at, page + 1, game_ids)
  } else {
    await db.update({_table: 'collections', id}, {
      $set: { game_ids, _fetched_at }
    })
    cache_collection_games(id)
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
  cache_owned_games()
}

/* Cache API results in DB */

async function cache_owned_games () {
  let keys = await db.find({_table: 'download_keys'})
  let gids = _.pluck(keys, 'game_id')
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
  let gids = _.pluck(caves, 'game_id')
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
  let gids = collection.game_ids || []
  let games = await db.find({_table: 'games', id: {$in: gids}})
  cache_games(`collections/${collection_id}`, games)
  AppActions.games_fetched(_.pluck(games, 'id'))
}

// TODO: Move game_browse somewhere else

async function game_browse (payload) {
  let game_id = payload.game_id
  let game = await db.find_game(game_id)
  electron.shell.openExternal(game.url)
}

let fetch_caved_games = _.throttle(() => {
  fetch_games({path: 'caved'})
}, 250, true)

function app_implode () {
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

  on(AppConstants.GAME_BROWSE, game_browse)
  on(AppConstants.APP_IMPLODE, app_implode)
}))

module.exports = GameStore
