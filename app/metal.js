'use strict'

require('bluebird').config({
  longStackTraces: true,
  cancellation: true
})
require('nodent')()

require('./util/crash-reporter').mount()

if (require('./util/auto-updater').start()) {
  // squirrel on win32 sometimes requires exiting as early as possible
  process.exit(0)
}

require('./stores/self-update-store')
require('./stores/window-store')
require('./stores/collection-store')
require('./stores/game-store')
require('./stores/notification-store')
require('./stores/tray-store')
require('./stores/setup-store')
require('./stores/cave-store')

let AppActions = require('./actions/app-actions')
let app = require('electron').app
app.on('ready', () => {
  require('./ui/menu').mount()
  AppActions.boot()
})
app.on('activate', AppActions.focus_window)
app.on('window-all-closed', e => e.preventDefault())
