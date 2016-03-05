
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'

import WindowStore from './window-store'
import TrayStore from './tray-store'
import Store from './store'

import os from '../util/os'

import electron from 'electron'
const {app} = electron

const state = {
  progress: -1
}

let NotificationStore = Object.assign(new Store('notification-store'), {
  get_progress: () => state.progress
})

function with_dock (f) {
  if (!app.dock) return
  f(app.dock)
}

function set_progress (progress) {
  with_dock(dock =>
    dock.setBadge(progress > 0 ? `${(progress * 100).toFixed()}%` : '')
  )
  WindowStore.with(w => w.setProgressBar(progress))

  state.progress = progress
  NotificationStore.emit_change()
}

function bounce () {
  with_dock(dock => dock.bounce())
}

function notify (content) {
  if (os.platform() === 'win32') {
    // HTML5 notification API not implemented in electron on win32 yet -- amos
    TrayStore.with(tray => tray.displayBalloon({title: 'itch.io', content}))
  } else {
    // using stringify as an escape mechanism
    AppActions.eval(`new Notification(${JSON.stringify(content)})`)
  }
}

AppDispatcher.register('notification-store', Store.action_listeners(on => {
  on(AppConstants.SET_PROGRESS, (payload) => set_progress(payload.alpha))
  on(AppConstants.BOUNCE, bounce)
  on(AppConstants.NOTIFY, (payload) => notify(payload.message))
}))

export default NotificationStore
