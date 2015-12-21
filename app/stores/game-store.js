'use strict'

let Promise = require('bluebird')
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

  console.log(`${key} diff: ${JSON.stringify(state_diff, null, 2)}`)
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

    await Promise.all([
      fetch_keys('owned_keys'),
      fetch_keys('claimed_keys')
    ])
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

async function fetch_keys (type, page) {
  if (typeof page === 'undefined') {
    page = 1
  }

  log(opts, `fetch_keys(${type}, ${page})`)

  let user = CredentialsStore.get_current_user()
  let keys = (await user[`my_${type}`]({page}))[type]

  if (keys.length) fetch_keys(type, page + 1)

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

async function cache_cave_game (_id) {
  let cave = await db.find_one({_table: 'caves', _id})
  let game = await db.find_one({_table: 'games', id: cave.game_id})
  cache_games(`caves/${_id}`, [game])
}

async function cache_collection_games (id) {
  let collection = await db.find_one({_table: 'collections', id})
  let gids = collection.game_ids || []
  let games = await db.find({_table: 'games', id: {$in: gids}})
  cache_games(`collections/${id}`, games)
  AppActions.games_fetched(_.pluck(games, 'id'))
}

// Move those actions somewhere else, there has to be
// a good store name we can find for browse, purchase, etc. ?

async function game_browse (payload) {
  let game = await db.find_one({_table: 'games', id: payload.id})
  electron.shell.openExternal(game.url)
}

async function game_purchase (payload) {
  let me = CredentialsStore.get_me()
  let game = await db.find_one({_table: 'games', id: payload.id})
  let keys = await db.find({_table: 'download_keys', game_id: payload.id})

  if (keys.length > 0) {
    let buttons = ['Purchase again', 'Cancel']
    let dialog_opts = {
      type: 'info',
      buttons,
      title: 'You already own this!',
      message: `You've already bought a copy of this.`,
      detail: `...but you could still buy a copy for a friend!\n\nDo you want to make another purchase?`
    }
    let response = require('electron').dialog.showMessageBox(dialog_opts)
    if (response !== 0) {
      return
    }
  }

  let path = require('path')
  let inject_path = path.resolve(__dirname, '..', 'inject', 'purchase.js')
  console.log(`Inject path = ${inject_path}`)
  let win = new electron.BrowserWindow({
    width: 960,
    height: 620,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      preload: inject_path,
      partition: `persist:itchio-${me.id}`
    }
  })

  let events = 'page-title-updated close closed unresponsive responsive blur focus maximize unmaximize minimize restore resize move moved enter-full-screen enter-html-full-screen leave-html-full-screen app-command'
  events.split(' ').forEach((ev) => {
    win.on(ev, (e, deets) => {
      console.log(`purchase window event: ${ev}, ${JSON.stringify(deets, null, 2)}`)
    })
  })

  let cevents = 'did-finish-load did-fail-load did-frame-finish-load did-start-loading did-stop-loading did-get-response-details did-get-redirect-request dom-ready page-favicon-updated new-window will-navigate crashed plugin-crashed destroyed'
  cevents.split(' ').forEach((ev) => {
    win.webContents.on(ev, (e, deets) => {
      console.log(`purchase webcontents event: ${ev}, ${JSON.stringify(deets, null, 2)}`)
    })
  })

  let purchase_url = game.url + '/purchase'
  let parsed = require('url').parse(purchase_url)

  // user.example.org => example.org
  let hostparts = parsed.hostname.split('.')
  hostparts.shift()
  let hostname = hostparts.join('.')

  let url_opts = {
    hostname,
    pathname: '/login',
    query: {return_to: purchase_url}
  }
  if (hostname === 'itch.io') {
    url_opts.protocol = 'https'
  } else {
    url_opts.port = parsed.port
    url_opts.protocol = parsed.protocol
  }

  let login_purchase_url = require('url').format(url_opts)

  win.webContents.on('did-get-redirect-request', (e, oldURL, newURL) => {
    if (oldURL.indexOf(`/login?`) !== -1) {
      // so, we're logged in now
      e.preventDefault()
      console.log(`redirect, newURL = ${newURL}`)
      // work around https://github.com/leafo/itch.io/issues/286
      win.loadURL(purchase_url)
    }

    let parsed = require('url').parse(newURL)
    if (/^.*\/download\/[a-zA-Z0-9]*$/.test(parsed.pathname)) {
      // purchase went through!
      AppActions.fetch_games('owned')
      AppActions.game_purchased(payload.id, `You just purchased ${game.title}! You should now be able to install it in one click.`)
      win.close()
    } else if (/\/pay\/cancel/.test(parsed.pathname)) {
      // payment was cancelled
      win.close()
    }
  })

  win.webContents.on('did-get-response-details', (e, status, newURL, originalURL, httpResponseCode) => {
    if (httpResponseCode === 404) {
      console.log(`response code is not found! closing`)
      win.close()

      let buttons = ['Ok', 'Open game page']
      let dialog_opts = {
        type: 'info',
        buttons,
        title: 'Payments disabled',
        message: `Unfortunately, the developer of ${game.title} does not accept payments for this title.`,
        detail: `Maybe you can find another way to support them?`
      }
      let response = require('electron').dialog.showMessageBox(dialog_opts)
      if (response === 1) {
        require('electron').shell.openExternal(game.url)
      }
    }
  })

  win.loadURL(login_purchase_url)
  win.show()
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
      fetch_games({path: 'caved'})
    }
  })

  on(AppConstants.CAVE_THROWN_INTO_BIT_BUCKET, (payload) => {
    fetch_games({path: 'caved'})
  })

  on(AppConstants.GAME_BROWSE, game_browse)
  on(AppConstants.GAME_PURCHASE, game_purchase)
}))

module.exports = GameStore
