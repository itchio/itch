
let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let db = require('../util/db')
let url = require('../util/url')
let debug_browser_window = require('../util/debug-browser-window')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let I18nStore = require('./i18n-store')

let Promise = require('bluebird')
let electron = require('electron')

let state = null

let PurchaseStore = Object.assign(new Store('purchase-store'), {
  get_state: () => state
})

/**
 * Creates a new browser window to initiate the purchase flow
 */
function make_purchase_window (me, game) {
  let path = require('path')
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

async function purchase_game (payload) {
  let game_id = payload.game_id
  let game = await db.find_game(game_id)

  let me = CredentialsStore.get_me()

  console.log(`trying to purchase ${JSON.stringify(game, null, 2)}`)

  // XXX working around https://github.com/itchio/itch/issues/379 for now
  // if (!game.can_be_bought) {
  //   if (await wants_to_browse_after_failure(game)) {
  //     AppActions.browse_game(game.id)
  //   }
  //   return
  // }

  let keys = await db.find({_table: 'download_keys', game_id})

  let already_owns = keys.length > 0
  if (already_owns) {
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
      AppActions.gamed_purchase(game_id, `You just purchased ${game.title}! You should now be able to install it in one click.`)
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
        AppActions.browse_game(game.id)
      }
    }
  })

  win.loadURL(login_purchase_url)
  win.show()
}

AppDispatcher.register('purchase-store', Store.action_listeners(on => {
  on(AppConstants.PURCHASE_GAME, purchase_game)
}))

module.exports = PurchaseStore
