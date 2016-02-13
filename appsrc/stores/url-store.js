let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')
let Store = require('./store')
let I18nStore = require('./i18n-store')

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

async function open_url (payload) {
  let url = payload.url
  log(opts, `open_url: ${url}`)

  if (rolling) {
    await handle_url(url)
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

async function try_install (game) {
  let plat = os.itch_platform()
  if (game[`p_${plat}`]) {
    log(opts, `try_install ${game.id}, compatible with ${plat}, installing`)
    return await install_prompt(game)
  } else {
    log(opts, `try_install ${game.id}, not available for ${plat}`)
    return await apology_prompt(game)
  }
}

async function handle_url (url_str) {
  log(opts, `handle_url: ${url_str}`)

  let url = url_parser.parse(url_str)

  let verb = url.hostname
  let tokens = url.pathname.split('/')

  switch (verb) {
    case 'install': {
      if (!tokens[1]) {
        log(opts, `for install: missing game_id, bailing out.`)
        return
      }
      let gid = parseInt(tokens[1], 10)

      let game = await db.find_game(gid)
      if (game) {
        await try_install(game)
      } else {
        log(opts, `for install: game not in db, fetchint ${gid} first`)
        to_install = gid
        AppActions.fetch_games(`games/${gid}`)
      }
    }
      break

    case 'launch': {
      if (!tokens[1]) {
        log(opts, `for install: missing game_id, bailing out.`)
        return
      }
      let gid = parseInt(tokens[1], 10)

      let game = await db.find_game(gid)
      if (game) {
        let cave = await db.find_cave_for_game(gid)
        if (cave) {
          AppActions.queue_game(gid)
        } else {
          log(opts, `game ${gid} known but not installed, queuing for install`)
          await try_install(game)
        }
      } else {
        log(opts, `don't even know about game ${gid}, trying to install instead`)
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
        log(opts, `games_fetched: we were waiting on ${gid}, waking it up!`)
        to_install = null

        let game = await db.find_game(gid)
        await try_install(game)
      }
    }
  } catch (e) {
    log(opts, `games_fetched error: ${e.stack || e}`)
  }
}

async function install_prompt (game) {
  let i18n = I18nStore.get_state()

  let cave = await db.find_cave_for_game(game.id)
  if (cave) {
    let panel = `caves/${cave._id}`
    log(opts, `have cave, focusing ${panel}`)
    AppActions.focus_panel(panel)
    return
  }

  log(opts, `no cave, opening prompt for ${game.title}`)
  let user = await db.find_user(game.user_id)

  let credit = ''
  if (user) {
    credit = '\n\n' + i18n.t('prompt.url_install.credit', {
      classification: game.classification,
      username: user.username
    })
  }

  let buttons = [
    i18n.t('prompt.action.install'),
    i18n.t('prompt.action.cancel')
  ]
  let dialog_opts = {
    type: 'question',
    buttons,
    title: i18n.t('prompt.url_install.title'),
    message: i18n.t('prompt.url_install.message', {title: game.title}),
    detail: `${game.short_text}${credit}`
  }

  let callback = (response) => {
    if (response === 0) {
      AppActions.queue_game(game.id)
    } else if (response === 1) {
      // welp
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

async function apology_prompt (game) {
  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.action.ok')
  ]
  let i18n_vars = {
    title: game.title,
    classification: game.classification,
    platform: os.itch_platform()
  }

  let dialog_opts = {
    type: 'error',
    buttons,
    title: i18n.t('prompt.no_compatible_version.title', i18n_vars),
    message: i18n.t('prompt.no_compatible_version.message', i18n_vars),
    detail: i18n.t('prompt.no_compatible_version.detail', i18n_vars)
  }

  let callback = () => {
    // not much to do anyway.
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
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
