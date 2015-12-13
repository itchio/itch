'use strict'

require('source-map-support').install()
require('bluebird').config({
  longStackTraces: true,
  cancellation: true
})

let env = require('./env')

if (env.name === 'development') {
  console.log('Development environment, using babel require hook')

  // use register hook in dev, production builds are precompiled.
  require('babel-register')
} else {
  console.log('Pre-compiled, not using require hook.')
}

require('./util/crash-reporter').mount()

let auto_updater = require('./util/auto-updater')
Promise.resolve(auto_updater.start()).then((quit) => {
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0)
  }
})

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
app.on('open-url', (e, url) => {
  if (/^itchio:/.test(url.toLowerCase())) {
    // we want to handle itchio:// URLs
    e.preventDefault()
    console.log(`open-url:stub | ${url}`)
  } else {
    console.log(`Ignoring unknown open-url: ${url}`)
  }
})
