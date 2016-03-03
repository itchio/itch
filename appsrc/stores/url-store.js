
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'
import Store from './store'
import CaveStore from './cave-store'
import I18nStore from './i18n-store'

import electron from 'electron'
const {dialog} = electron

import url_parser from 'url'

import {Logger} from '../util/log'
import mklog from '../util/log'
const log = mklog('url-store')
const opts = {
  logger: new Logger()
}

import market from '../util/market'
import fetch from '../util/fetch'
import os from '../util/os'

const UrlStore = Object.assign(new Store('url-store'), {})

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

async function try_install (game) {
  const plat = os.itch_platform()
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
  const url = url_parser.parse(url_str)

  const verb = url.hostname
  const tokens = url.pathname.split('/')

  switch (verb) {
    case 'install': {
      if (!tokens[1]) {
        log(opts, `for install: missing game, bailing out.`)
        return
      }
      const gid = parseInt(tokens[1], 10)

      const game = await fetch.game_lazily(market, gid)
      if (game) {
        await try_install(game)
      } else {
        log(opts, `for install: invalid game id ${gid}`)
      }
      break
    }

    case 'launch': {
      if (!tokens[1]) {
        log(opts, `for install: missing game, bailing out.`)
        return
      }
      const gid = parseInt(tokens[1], 10)

      const game = await fetch.game_lazily(market, gid)
      if (game) {
        let cave = CaveStore.find_for_game(game.id)
        if (cave) {
          // XXX: careful with that, maybe at some point 'queue_game' won't
          // be the only primary action anymore?
          AppActions.queue_game(game)
        } else {
          log(opts, `game ${gid} known but not installed, queuing for install`)
          await try_install(game)
        }
      } else {
        log(opts, `for install: invalid game id ${gid}`)
      }
      break
    }

    default: {
      log(opts, `unsupported verb: ${verb}, bailing out`)
      AppActions.focus_window()
      break
    }
  }
}

async function install_prompt (game) {
  let i18n = I18nStore.get_state()

  let cave = CaveStore.find_for_game(game.id)
  if (cave) {
    let panel = `caves/${cave.id}`
    log(opts, `have cave, focusing ${panel}`)
    AppActions.focus_panel(panel)
    return
  }

  log(opts, `no cave, opening prompt for ${game.title}`)
  let user = market.get_entities('users')[game.user_id]

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
      AppActions.queue_game(game)
    } else if (response === 1) {
      // welp
    }
  }
  dialog.showMessageBox(dialog_opts, callback)
}

async function apology_prompt (game) {
  const i18n = I18nStore.get_state()

  const buttons = [
    i18n.t('prompt.action.ok')
  ]
  const i18n_vars = {
    title: game.title,
    classification: game.classification,
    platform: os.itch_platform()
  }

  const dialog_opts = {
    type: 'error',
    buttons,
    title: i18n.t('prompt.no_compatible_version.title', i18n_vars),
    message: i18n.t('prompt.no_compatible_version.message', i18n_vars),
    detail: i18n.t('prompt.no_compatible_version.detail', i18n_vars)
  }

  const callback = () => {
    // not much to do anyway.
  }
  dialog.showMessageBox(dialog_opts, callback)
}

function logout () {
  queue_item = null
}

AppDispatcher.register('url-store', Store.action_listeners(on => {
  on(AppConstants.OPEN_URL, open_url)
  on(AppConstants.READY_TO_ROLL, process_queue)
  on(AppConstants.LOGOUT, logout)
}))

export default UrlStore
