
import AppActions from '../actions/app-actions'
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import Store from './store'
import I18nStore from './i18n-store'

import electron from 'electron'
const {app, BrowserWindow} = electron

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
    AppActions.gain_focus()
    window.show()
    return
  }

  let width = 1220
  let height = 720

  window = new BrowserWindow({
    title: 'itch',
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

  window.on('focus', (e) => {
    AppActions.gain_focus()
  })

  window.webContents.on('dom-ready', (e) => {
    AppActions.window_ready()
    window.show()
  })
  window.loadURL(`file://${__dirname}/../index.html`)

  if (process.env.DEVTOOLS === '1') {
    window.webContents.openDevTools({detach: true})
  }
}

function hide () {
  let w = BrowserWindow.getFocusedWindow()
  if (!w) return
  w.close()
}

function _eval (payload) {
  if (!window) return
  let web = window.webContents
  if (!web) return
  web.executeJavaScript(payload.code)
}

AppDispatcher.register('window-store', Store.action_listeners(on => {
  on(AppConstants.BOOT, show)
  on(AppConstants.FOCUS_WINDOW, show)
  on(AppConstants.HIDE_WINDOW, hide)
  on(AppConstants.EVAL, _eval)
  on(AppConstants.QUIT_WHEN_MAIN, () => {
    let focused = BrowserWindow.getFocusedWindow()
    if (!focused) return

    if (window && focused.id === window.id) {
      AppActions.quit()
    } else {
      focused.close()
    }
  })
  on(AppConstants.QUIT, () => {
    quitting = true
    app.quit()
  })
  on(AppConstants.CHANGE_USER, () => {
    if (!window) return
    let web = window.webContents
    if (!web) return
    let i18n = I18nStore.get_state()
    let logout_string = i18n.t('prompt.logout_confirm')
    web.executeJavaScript(`
      var yes = window.confirm(${JSON.stringify(logout_string)})
      if (yes) {
        require('./actions/app-actions').default.logout()
      }
    `)
  })
  on(AppConstants.APPLY_SELF_UPDATE, () => {
    quitting = true
    AppActions.apply_self_update_for_realsies()
  })
}))

app.on('before-quit', e => {
  quitting = true
})

app.on('window-all-closed', e => {
  if (quitting) {
    console.log(`app event: window-all-closed; quitting, all good`)
    return
  }
  console.log(`app event: window-all-closed; preventing default`)
  e.preventDefault()
})

export default WindowStore
