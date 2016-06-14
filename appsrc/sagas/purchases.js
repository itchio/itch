
import invariant from 'invariant'

import {findWhere} from 'underline'

import url from '../util/url'
import enableEventDebugging from '../util/debug-browser-window'

import createQueue from './queue'
import {takeEvery} from './effects'
import {select, call} from 'redux-saga/effects'

import {INITIATE_PURCHASE} from '../constants/action-types'
import {purchaseCompleted} from '../actions'

import {BrowserWindow} from 'electron'
import path from 'path'

const injectPath = path.resolve(__dirname, '..', 'inject', 'purchase.js')

/**
 * Creates a new browser window to initiate the purchase flow
 */
function makePurchaseWindow (me, game) {
  const partition = `persist:itchio-${me.id}`
  console.log(`making purchase window with partition ${partition}`)

  const win = new BrowserWindow({
    width: 960,
    height: 620,
    center: true,
    title: game.title,
    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* prevent window close, prefill login form, etc. */
      preload: injectPath,
      /* stores browser session in an user_id-specific partition so,
       * in multi-seat installs, users have to log in one time each at least */
      partition
    }
  })

  // hide menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenuBarVisibility(false)

  return win
}

function buildLoginAndReturnUrl (return_to) {
  const parsed = url.parse(return_to)
  const hostname = url.subdomainToDomain(parsed.hostname)

  let urlOpts = {
    hostname,
    pathname: '/login',
    query: {return_to}
  }

  if (hostname === 'itch.io') {
    urlOpts.protocol = 'https'
  } else {
    urlOpts.port = parsed.port
    urlOpts.protocol = parsed.protocol
  }

  return url.format(urlOpts)
}

function * _initiatePurchase (action) {
  const queue = createQueue('purchase')

  const {game} = action.payload
  invariant(typeof game === 'object', 'game is object')

  const me = yield select((state) => state.session.credentials.me)

  // XXX 'can_be_bought' API field seems buggy for now?
  // cf. https://github.com/itchio/itch/issues/379

  const downloadKeys = yield select((state) => state.market.downloadKeys)
  const key = downloadKeys::findWhere({gameId: game.id})
  const win = makePurchaseWindow(me, game)

  if (process.env.CAST_NO_SHADOW === '1') {
    enableEventDebugging('purchase', win)
    win.webContents.openDevTools({detach: true})
  }

  const purchaseUrl = game.url + '/purchase'
  const loginPurchaseUrl = buildLoginAndReturnUrl(purchaseUrl)
  console.log('partition login purchase url = ', loginPurchaseUrl)

  // FIXME: that's probably not the best event
  win.webContents.on('did-get-redirect-request', (e, oldURL, newURL) => {
    const parsed = url.parse(newURL)

    if (/^.*\/download\/[a-zA-Z0-9]*$/.test(parsed.pathname)) {
      // purchase went through!
      queue.dispatch(purchaseCompleted({game, hadKey: !!key}))
      win.close()
    } else if (/\/pay\/cancel/.test(parsed.pathname)) {
      // payment was cancelled
      win.close()
    }
  })

  win.webContents.on('did-get-response-details', async function (e, status, newURL, originalURL, httpResponseCode) {
    if (httpResponseCode === 404 && newURL === purchaseUrl) {
      console.log(`404 not found: ${newURL}`)
      console.log('closing because of 404')
      win.close()
    }
  })

  const endType = 'DONE_PURCHASING'
  win.on('close', () => {
    queue.dispatch(endType)
  })

  win.loadURL(loginPurchaseUrl)
  win.show()

  yield call(queue.exhaust, {endType})
}

export default function * purchaseSaga () {
  yield [
    takeEvery(INITIATE_PURCHASE, _initiatePurchase)
  ]
}
