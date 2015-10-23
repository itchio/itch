
console.log(`In metal, process type = ${process.type}`)

require('source-map-support').install()
require('./util/crash-reporter').mount()

if (require('./util/auto-updater').run()) {
  // squirrel on win32 sometimes requires exiting as early as possible
  process.exit(0)
}

require('./stores/window-store')
require('./stores/collection-store')
require('./stores/game-store')
require('./stores/notification-store')
require('./stores/tray-store')
require('./stores/setup-store')
require('./stores/install-store')

let AppActions = require('./actions/app-actions')
let app = require('app')
app.on('ready', () => {
  require('./ui/menu').mount()
  AppActions.boot()
})
app.on('activate', AppActions.focus_window)
app.on('window-all-closed', e => e.preventDefault())
