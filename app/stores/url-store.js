'use strict'

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')
let Store = require('./store')

let electron = require('electron')

let url_parser = require('url')

let Logger = require('../util/log').Logger
let opts = {
  logger: new Logger()
}
let log = require('../util/log')('url-store')
let db = require('../util/db')

let UrlStore = Object.assign(new Store('url-store'), {})

let rolling = false
let queue_item = null

function open_url (payload) {
  let url = payload.url
  log(opts, `open_url: ${url}`)

  if (rolling) {
    handle_url(url)
  } else {
    queue_item = url
  }
}

function process_queue () {
  rolling = true

  log(opts, `process_queue`)
  if (queue_item) {
    handle_url(queue_item)
    queue_item = null
  }
}

let to_install = null

function handle_url (urlStr) {
  log(opts, `handle_url: ${urlStr}`)

  let url = url_parser.parse(urlStr)

  let verb = url.hostname
  let tokens = url.pathname.split('/')

  switch (verb) {
    case 'install': {
      let game_id = tokens[1]
      if (!game_id) {
        log(opts, `for install: missing game_id, bailing out.`)
        return
      }

      to_install = parseInt(game_id, 10)
      AppActions.fetch_games(`games/${game_id}`)
      break;
    }

    default: {
      log(opts, `unsupported verb: ${verb}, bailing out`)
    }
  }
}

async function games_fetched (payload) {
  try {
    for (let gid of payload.game_ids) {
      if (to_install == gid) {
        to_install = null

        let game = await db.find_one({_table: 'games', id: gid})
        let user = await db.find_one({_table: 'users', id: game.user_id})
        let credit = user ? `\n\nA ${game.classification} by ${user.username}` : ''

        let buttons = ['Yes', 'Cancel']
        let dialog_opts = {
          type: 'question',
          buttons,
          title: 'Install request',
          message: `Do you want to install ${game.title}?`,
          detail: `${game.short_text}${credit}`
        }
        let response = electron.dialog.showMessageBox(dialog_opts)
        if (response === 0) {
          AppActions.cave_queue(gid)
        } else if (response === 1) {
          // welp
        }
      }
    }
  } catch (e) {
    log(opts, `games_fetched error: ${e.stack || e}`)
  }
}

function logout () {
  queue_item = null
}

AppDispatcher.register('url-store', Store.action_listeners(on => {
  on(AppConstants.OPEN_URL, open_url)
  on(AppConstants.READY_TO_ROLL, process_queue)
  on(AppConstants.LOGOUT, logout)
  on(AppConstants.GAMES_FETCHED, games_fetched)
}))

module.exports = UrlStore
