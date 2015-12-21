
let Store = require('./store')
let CredentialsStore = require('./credentials-store')

let db = require('../util/db')
let url = require('../util/url')

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

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
  let buttons = ['Purchase again', 'Cancel']
  let dialog_opts = {
    type: 'info',
    buttons,
    title: 'You already own this!',
    message: `You've already bought a copy of ${game.title}.`,
    detail: `...but you could still buy a copy for a friend!\n\nDo you want to make another purchase?`
  }
  let response = require('electron').dialog.showMessageBox(dialog_opts)
  return (response === 0)
}

/**
 * Gives us some log of what happens in the browser window, helps debugging the flow
 */
function enable_event_debugging (win) {
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
}

function wants_to_browse_after_failure (game) {
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

async function game_purchase (payload) {
  let me = CredentialsStore.get_me()
  let game = await db.find_one({_table: 'games', id: payload.id})
  let keys = await db.find({_table: 'download_keys', game_id: payload.id})

  let already_owns = keys.length > 0
  if (already_owns && !wants_to_buy_twice(game)) {
    // user didn't want to buy twice
    return
  }

  let win = make_purchase_window(me, game)

  if (process.env.CAST_NO_SHADOW === '1') {
    enable_event_debugging(win)
    win.webContents.openDevTools({detach: true})
  }

  let purchase_url = game.url + '/purchase'
  let login_purchase_url = build_login_and_return_url(purchase_url)

  win.webContents.on('did-get-redirect-request', (e, oldURL, newURL) => {
    let parsed = url.parse(newURL)

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

      if (wants_to_browse_after_failure(game)) {
        AppActions.game_browse(game.id)
      }
    }
  })

  win.loadURL(login_purchase_url)
  win.show()
}

AppDispatcher.register('purchase-store', Store.action_listeners(on => {
  on(AppConstants.GAME_PURCHASE, game_purchase)
}))

module.exports = PurchaseStore
