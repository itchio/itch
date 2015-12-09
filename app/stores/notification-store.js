'use nodent';'use strict'
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')

let WindowStore = require('./window-store')
let TrayStore = require('./tray-store')
let Store = require('./store')

let os = require('../util/os')
let defer = require('../util/defer')

let app = require('electron').app

let state = {
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
    TrayStore.with(tray => tray.displayBalloon({ title: 'itch.io', content }))
  } else {
    // using stringify as an escape mechanism
    defer(() => {
      AppActions.eval(`new Notification(${JSON.stringify(content)})`)
    })
  }
}

AppDispatcher.register('notification-store', Store.action_listeners(on => {
  on(AppConstants.SET_PROGRESS, action => set_progress(action.alpha))
  on(AppConstants.BOUNCE, bounce)
  on(AppConstants.NOTIFY, action => notify(action.message))
}))

module.exports = NotificationStore
