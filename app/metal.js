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
  } else {
    boot()
  }
})

let electron = require('electron')

function boot () {
  let AppActions = require('./actions/app-actions')
  let app = electron.app

  let should_quit = app.makeSingleInstance(AppActions.focus_window)
  if (should_quit) {
    app.quit()
  }

  app.on('ready', () => {
    ready()
  })
  app.on('activate', AppActions.focus_window)
  app.on('window-all-closed', e => e.preventDefault())

  ;['before-quit', 'will-quit', 'quit'].forEach((kind) => {
    app.on(kind, (e) => console.log(`app event: ${kind}`))
  })
}

function ready () {
  let AppActions = require('./actions/app-actions')

  require('./stores/self-update-store')
  require('./stores/window-store')
  require('./stores/collection-store')
  require('./stores/game-store')
  require('./stores/notification-store')
  require('./stores/tray-store')
  require('./stores/setup-store')
  require('./stores/cave-store')
  require('./stores/url-store')

  require('./ui/menu').mount()
  AppActions.boot()

  handle_urls()
}

// URL handling

function is_itchio_url (s) {
  return /^itchio:/i.test(s)
}

function handle_urls () {
  let AppActions = require('./actions/app-actions')
  let app = electron.app

  // OSX (Info.pList)
  app.on('open-url', (e, url) => {
    if (/^itchio:/.test(url.toLowerCase())) {
      // OSX will err -600 if we don't
      e.preventDefault()
      AppActions.open_url(url)
    } else {
      console.log(`Ignoring non-itchio url: ${url}`)
    }
  })

  // Windows (reg.exe), Linux (XDG)
  process.argv.forEach((arg) => {
    // XXX should we limit to one url at most ?
    if (is_itchio_url(arg)) {
      AppActions.open_url(arg)
    }
  })
}
