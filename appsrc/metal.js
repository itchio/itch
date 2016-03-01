'use strict'

require('source-map-support').install()

const env = require('./env')

if (env.name === 'development') {
  console.log('Development environment, using debug-friendly settings')

  require('bluebird').config({
    longStackTraces: true
  })
} else {
  console.log('Production environment, using optimized settings')

  require('bluebird').config({
    longStackTraces: false
  })
}

if (!process.env.NODE_ENV) {
  console.log(`Setting NODE_ENV to ${env.name}`)
  process.env.NODE_ENV = env.name
} else {
  console.log(`NODE_ENV manually set to ${process.env.NODE_ENV}`)
}

require('./util/sf')
require('./util/crash-reporter').default.mount()

const auto_updater = require('./util/auto-updater')
Promise.resolve(auto_updater.start()).then((quit) => {
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0)
  } else {
    boot()
  }
})

const electron = require('electron')

function boot () {
  const AppActions = require('./actions/app-actions')
  let app = electron.app

  let should_quit = app.makeSingleInstance((argv, cwd) => {
    handle_urls(argv)
    AppActions.focus_window()
  })
  if (should_quit) {
    // app.quit() is the source of all our problems,
    // cf. https://github.com/itchio/itch/issues/202
    process.exit(0)
  }

  app.on('ready', () => {
    ready()
  })
  app.on('activate', AppActions.focus_window)
}

function ready () {
  const AppActions = require('./actions/app-actions').default

  require('./stores/i18n-store')
  require('./stores/self-update-store')
  require('./stores/window-store')
  require('./stores/collection-store')
  require('./stores/game-store')
  require('./stores/notification-store')
  require('./stores/tray-store')
  require('./stores/setup-store')
  require('./stores/cave-store')
  require('./stores/url-store')
  require('./stores/policy-store')
  require('./stores/purchase-store')
  require('./stores/report-store')
  require('./stores/install-location-store')

  require('./ui/menu').default.mount()

  AppActions.boot()

  register_url_handler()
}

// URL handling

function is_itchio_url (s) {
  return /^itchio:/i.test(s)
}

function register_url_handler () {
  const AppActions = require('./actions/app-actions')

  // OSX (Info.pList)
  electron.app.on('open-url', (e, url) => {
    if (/^itchio:/.test(url.toLowerCase())) {
      // OSX will err -600 if we don't
      e.preventDefault()
      AppActions.open_url(url)
    } else {
      console.log(`Ignoring non-itchio url: ${url}`)
    }
  })

  handle_urls(process.argv)
}

function handle_urls (argv) {
  const AppActions = require('./actions/app-actions')

  // Windows (reg.exe), Linux (XDG)
  argv.forEach((arg) => {
    // XXX should we limit to one url at most ?
    if (is_itchio_url(arg)) {
      AppActions.open_url(arg)
    }
  })
}
