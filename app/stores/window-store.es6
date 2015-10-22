import AppActions from '../actions/app-actions'
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import Store from './store'

import app from 'app'
import BrowserWindow from 'browser-window'

let window
let quitting = false

let WindowStore = Object.assign(new Store('window-store'), {
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

  window.on('close', (e) => {
    if (quitting) return
    e.preventDefault()
    window.hide()
  })
  window.webContents.on('dom-ready', (e) => {
    AppActions.window_ready()
    window.show()
  })
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

AppDispatcher.register('window-store', Store.action_listeners(on => {
  on(AppConstants.BOOT, show)
  on(AppConstants.FOCUS_WINDOW, show)
  on(AppConstants.HIDE_WINDOW, hide)
  on(AppConstants.EVAL, _eval)
  on(AppConstants.QUIT, () => {
    quitting = true
    app.quit()
  })
}))

export default WindowStore
