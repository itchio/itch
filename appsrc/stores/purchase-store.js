
import Store from './store'
import CredentialsStore from './credentials-store'

import {findWhere} from 'underline'

import market from '../util/market'
import url from '../util/url'
import debug_browser_window from '../util/debug-browser-window'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'

import I18nStore from './i18n-store'

import Promise from 'bluebird'
import electron from 'electron'
import path from 'path'

let state = null

let PurchaseStore = Object.assign(new Store('purchase-store'), {
  get_state: () => state
})

/**
 * Creates a new browser window to initiate the purchase flow
 */
function make_purchase_window (me, game) {
  let inject_path = path.resolve(__dirname, '..', 'inject', 'purchase.js')
  let win = new electron.BrowserWindow({
    width: 960,
    height: 620,
    center: true,
    title: `Purchase ${game.title}`,
    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* prevent window close, prefill login form, etc. */
      preload: inject_path,
      /* stores browser session in an user_id-specific partition so,
       * in multi-seat installs, users have to log in one time each at least */
      partition: `persist:itchio-${me.id}`
    }
  })

  // clear menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenu(null)

  return win
}

/**
 * Returns true if user confirms that they do, indeed, want to buy
 * an additional copy of something
 */
function wants_to_buy_twice (game) {
  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.additional_purchase.purchase_again'),
    i18n.t('prompt.action.cancel')
  ]
  let dialog_opts = {
    type: 'info',
    buttons,
    title: i18n.t('prompt.additional_purchase.title'),
    message: i18n.t('prompt.additional_purchase.message', {title: game.title}),
    detail: i18n.t('prompt.additional_purchase.detail')
  }

  return new Promise((resolve, reject) => {
    require('electron').dialog.showMessageBox(dialog_opts, (response) => resolve(response === 0))
  })
}

function wants_to_browse_after_failure (game) {
  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.action.ok'),
    i18n.t('prompt.payments_disabled.open_web_page')
  ]
  let dialog_opts = {
    type: 'info',
    buttons,
    title: i18n.t('prompt.payments_disabled.title'),
    message: i18n.t('prompt.payments_disabled.message', {title: game.title}),
    detail: i18n.t('prompt.payments_disabled.detail')
  }

  return new Promise((resolve, reject) => {
    require('electron').dialog.showMessageBox(dialog_opts, (response) => resolve(response === 1))
  })
}

function build_login_and_return_url (return_to) {
  let parsed = url.parse(return_to)
  let hostname = url.subdomain_to_domain(parsed.hostname)

  let url_opts = {
    hostname,
    pathname: '/login',
    query: {return_to}
  }

  if (hostname === 'itch.io') {
    url_opts.protocol = 'https'
  } else {
    url_opts.port = parsed.port
    url_opts.protocol = parsed.protocol
  }

  return url.format(url_opts)
}

async function initiate_purchase (payload) {
  pre: { // eslint-disable-line
    typeof payload.game === 'object'
  }
  let game = payload.game

  let me = CredentialsStore.get_me()

  // XXX 'can_be_bought' API field seems buggy for now?
  // cf. https://github.com/itchio/itch/issues/379

  let key = market.get_entities('download_keys')::findWhere({game_id: game.id})
  if (key) {
    let wants = await wants_to_buy_twice(game)
    // user didn't want to buy twice
    if (!wants) return
  }

  let win = make_purchase_window(me, game)

  if (process.env.CAST_NO_SHADOW === '1') {
    debug_browser_window('purchase', win)
    win.webContents.openDevTools({detach: true})
  }

  let purchase_url = game.url + '/purchase'
  let login_purchase_url = build_login_and_return_url(purchase_url)

  win.webContents.on('did-get-redirect-request', (e, oldURL, newURL) => {
    let parsed = url.parse(newURL)

    if (/^.*\/download\/[a-zA-Z0-9]*$/.test(parsed.pathname)) {
      // purchase went through!
      AppActions.fetch_games('owned')
      AppActions.purchase_completed(game, `You just purchased ${game.title}! You should now be able to install it in one click.`)
      win.close()
    } else if (/\/pay\/cancel/.test(parsed.pathname)) {
      // payment was cancelled
      win.close()
    }
  })

  win.webContents.on('did-get-response-details', async (e, status, newURL, originalURL, httpResponseCode) => {
    if (httpResponseCode === 404 && newURL === purchase_url) {
      console.log(`404 not found: ${newURL}`)
      console.log(`closing because of 404`)
      win.close()

      if (await wants_to_browse_after_failure(game)) {
        AppActions.browse_game(game.id, game.url)
      }
    }
  })

  win.loadURL(login_purchase_url)
  win.show()
}

AppDispatcher.register('purchase-store', Store.action_listeners(on => {
  on(AppConstants.INITIATE_PURCHASE, initiate_purchase)
}))

export default PurchaseStore
