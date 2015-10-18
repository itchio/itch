import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import Store from './store'

import BrowserWindow from 'browser-window'

let window

let WindowStore = Object.assign(new Store(), {
  with: (f) => {
    if (!window) return
    f(window)
  }
})

function show () {
  if (window) {
    window.show()
    return
  }

  let width = 1200
  let height = 720

  window = new BrowserWindow({
    title: 'itch.io',
    icon: './static/images/itchio-tray-x4.png',
    width, height,
    center: true,
    show: false,
    'title-bar-style': 'hidden'
  })

  window.on('close', (e) => window = null)
  window.webContents.on('dom-ready', (e) => window.show())
  window.loadUrl(`file://${__dirname}/../index.html`)

  if (process.env.DEVTOOLS === '1') {
    window.openDevTools()
  }
}

function hide () {
  WindowStore.with(w => w.hide())
}

function _eval (action) {
  if (!window) return
  let {webContents} = window
  if (!webContents) return
  webContents.executeJavaScript(action.code)
}

WindowStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.BOOT, show)
  on(AppConstants.FOCUS_WINDOW, show)
  on(AppConstants.HIDE_WINDOW, hide)
  on(AppConstants.EVAL, _eval)
}))

export default WindowStore
