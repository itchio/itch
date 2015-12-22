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
let os = require('../util/os')

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

// TODO: game fetching / queuing probably isn't urlstore's job

let to_install = null

async function handle_url (urlStr) {
  log(opts, `handle_url: ${urlStr}`)

  let url = url_parser.parse(urlStr)

  let verb = url.hostname
  let tokens = url.pathname.split('/')

  switch (verb) {
    case 'install': {
      if (!tokens[1]) {
        log(opts, `for install: missing game_id, bailing out.`)
        return
      }
      let gid = parseInt(tokens[1], 10)

      let game = await db.find_one({_table: 'games', id: gid})
      if (game) {
        let plat = os.itch_platform()
        if (game[`p_${plat}`]) {
          install_prompt(game)
        } else {
          apology_prompt(game)
        }
      } else {
        to_install = gid
        AppActions.fetch_games(`games/${gid}`)
      }
    }
      break

    default: {
      log(opts, `unsupported verb: ${verb}, bailing out`)
      AppActions.focus_window()
    }
      break
  }
}

async function games_fetched (payload) {
  try {
    for (let gid of payload.game_ids) {
      if (to_install === gid) {
        to_install = null

        let game = await db.find_one({_table: 'games', id: gid})
        await install_prompt(game)
      }
    }
  } catch (e) {
    log(opts, `games_fetched error: ${e.stack || e}`)
  }
}

async function install_prompt (game) {
  let cave = await db.find_one({_table: 'caves', game_id: game.id})
  if (cave) {
    let panel = `caves/${cave._id}`
    log(opts, `have cave, focusing ${panel}`)
    AppActions.focus_panel(panel)
    return
  }

  log(opts, `no cave, opening prompt for ${game.title}`)
  let user = await db.find_one({_table: 'users', id: game.user_id})
  let credit = user ? `\n\nA ${game.classification} by ${user.username}` : ''

  let buttons = ['Install', 'Cancel']
  let dialog_opts = {
    type: 'question',
    buttons,
    title: 'Install request',
    message: `Do you want to install ${game.title}?`,
    detail: `${game.short_text}${credit}`
  }

  let response = electron.dialog.showMessageBox(dialog_opts)
  if (response === 0) {
    AppActions.cave_queue(game.id)
  } else if (response === 1) {
    // welp
  }
}

async function apology_prompt (game) {
  let buttons = ['Ok']
  let dialog_opts = {
    type: 'error',
    buttons,
    title: `${game.title} on ${os.itch_platform()}`,
    message: `We couldn't find an ${game.title} version for ${os.itch_platform()}.`,
    detail: `Perhaps the ${game.classification} isn't compatible with it yet?`
  }

  electron.dialog.showMessageBox(dialog_opts)
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
