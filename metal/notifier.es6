
import app from 'app'

import main_window from './main_window'
import AppConstants from './constants/app_constants'
import AppDispatcher from './dispatcher/app_dispatcher'
import os from './util/os'

function set_progress_bar (alpha) {
  let win = main_window.get()
  if (!win) return
  win.setProgressBar(alpha)
}

function set_badge (msg) {
  let {dock} = app
  if (!dock) return
  dock.setBadge(msg)
}

function bounce () {
  let {dock} = app
  if (!dock) return
  dock.bounce()
}

export function install () {
  AppDispatcher.register((action) => {
    switch (action.action_type) {

      case AppConstants.SET_PROGRESS:
        let { alpha } = action
        let percent = alpha * 100
        set_progress_bar(alpha)
        set_badge(percent.toFixed() + '%')
        break

      case AppConstants.CLEAR_PROGRESS:
        set_progress_bar(-1)
        set_badge('')
        break

      case AppConstants.BOUNCE:
        bounce()
        break

      case AppConstants.NOTIFY: {
        let { message } = action
        switch (os.platform()) {
          case 'win32':
            let {main_tray} = app
            if (!main_tray) return
            main_tray.displayBalloon({
              title: 'itch.io',
              content: message
            })
            break
          default:
            let win = require('./main_window').get()
            if (!win) return
            let {webContents} = win
            if (!webContents) return

            let code = `new Notification(${JSON.stringify(message)})`
            webContents.executeJavaScript(code)
            break
        }
        break
      }
    }
  })
}
